import React, { Component } from 'react'
import { connect } from 'react-redux'
import PIXI, { Container, Graphics, Sprite, Text } from 'pixi.js'
import Tone, { Loop, Transport } from 'tone'
import _throttle from 'lodash/throttle'
import _debounce from 'lodash/debounce'
import _get from 'lodash/get'
import $ from 'jquery'

import Point from '../Point'
import newId from '../utils/newId'
import { getByKey } from '../utils/arrayUtils'
import { dist, clamp, inBounds } from '../utils/mathUtils'
import { checkDifferenceAny } from '../utils/lifecycleUtils'
import { getPixelDensity, addResizeCallback, triggerResize } from '../utils/screenUtils'
import { isUpKeyPressed, isDownKeyPressed, isLeftKeyPressed, isRightKeyPressed, addKeyListener } from '../utils/keyUtils'

import noteColors from '../constants/noteColors'
import * as NoteTypes from '../constants/noteTypes'
import * as ActionTypes from '../constants/actionTypes'
import { bindNodeEvents } from '../nodeEventHandlers'
import { BEAT_PX, METER_TICKS } from '../constants/globals'
import { createNode, removeNode, updateNode } from '../reducers/stage'
import { getRandomNote, getAscendingNote, getDescendingNote, playNote } from '../sound'
import { createRingFX, redrawPointNode, redrawRingGuides } from '../nodeGraphics'
import { createPointNode, createRingNode, createArcNode, createRadarNode } from '../nodeGenerators'
import { nodeTypeLookup, nodeTypeKeys, POINT_NODE, ARC_NODE, ORIGIN_RING_NODE, ORIGIN_RADAR_NODE } from '../constants/nodeTypes'

const scaleEase = 10;
const mouseMoveThrottle = 1000/50; // 50fps
const scrollwheelThrottle = 1000/50; // 50fps
let indicatorOsc = 0;

class PrimaryInterface extends Component {

	static defaultProps = {
		maxZoom: 2,
		minZoom: 0.5,
		showDebugDots: false,
		showFPS: true,
	};

	constructor(props) {
		super(props);
		this.handlePointerMove = _throttle(this.handlePointerMove, mouseMoveThrottle);
		this.handleMousewheel = _throttle(this.handleMousewheel, scrollwheelThrottle);
		this.handleNodeMove = _debounce(this.handleNodeMove, 50);
	}

	componentDidMount() {

		// get initial dimensions
		this.$container = $(this.refs.container);
		this.handleResize();
			
		// init renderer
		this.renderer = new PIXI.autoDetectRenderer(this.width/getPixelDensity(), this.height/getPixelDensity(), {
			resolution: getPixelDensity(), 
			transparent: false, 
			backgroundColor: 0x000000, 
			antialiasing: true
		});
		this.canvas = this.renderer.view;
		this.$container.append(this.canvas);

		// init stage
		this.stage = new Container();
		this.stage.scale.set(1/getPixelDensity());
		this.stage.pivot.set(0, 0);
		this.stage.interactive = true;
		this.stage.hitArea = new PIXI.Rectangle(0,0,10000,10000);
		this.aimScale = 1;

		// bind mouse / touch events
		this.stage.on('mousedown', event => this.handlePointerDown(event));
		this.stage.on('touchstart', event => this.handlePointerDown(event));
		this.stage.on('mousemove', event => this.handlePointerMove(event));
		this.stage.on('touchmove', event => this.handlePointerMove(event));
		this.stage.on('mouseup', event => this.handlePointerUp(event));
		this.stage.on('touchend', event => this.handlePointerUp(event));

		// wrapper for stage
		this.stageWrapper = new Container();
		this.stageWrapper.addChild(this.stage);

		// debug rainbow dots
		if(this.props.showDebugDots) {
			const dots = new Graphics();
			dots.beginFill(0xFFFFFF);
			for(let x=0; x<100; x ++) {
				for(let y=0; y<100; y++) {
					dots.beginFill(noteColors[(x+y)%noteColors.length]);
					dots.drawCircle(x*40, y*40, 5);
				}
			}
			dots.cacheAsBitmap = true;
			this.stage.addChild(dots);
		}

		// fps counter
		if(this.props.showFPS) {
			this.fps = new Text('', {font: '16px Orbitron', fontWeight: '500', fill: 'white'});
			this.fps.position = {x: 5, y: 5};
			this.fpsCache = new Array(60).map(t => 60);
			this.lastFps = Date.now();
			// wait for font to load / fps to stabilize
			setTimeout(() => this.stageWrapper.addChild(this.fps), 1000); 
		}

		this.dragTarget = null;
		this.activeNode = null;
		this.activeNodeIndicator = new Graphics();
		this.activeNodeIndicator.lineStyle(2, 0xFFFFFF, 0.5);
		this.activeNodeIndicator.drawCircle(0, 0, 15);
		this.activeNodeIndicator.cacheAsBitmap = true;
		this.stage.addChild(this.activeNodeIndicator);

		this.ringsFX = [];
		this.fxContainer = new Container();
		this.stage.addChild(this.fxContainer);

		// state vars
		this.mouseMoved = false;
		this.mouseDown = false;
		this.stageCursor = new Point(0,0);
		this.lastStageCursor = new Point(0,0);
		this.cursor = new Point(0,0);
		this.lastCursor = new Point(0,0);
		this.mouseDownPosition = new Point(0,0);

		// instanciate local references of pixi node instances
		this.initedNodeIds = [];
		for(let nodeKey of Object.keys(nodeTypeLookup)) {
			this[nodeTypeLookup[nodeKey]] = {};
		}

		// transport callback
		this.loop = new Loop(::this.tick, this.props.transport.meterTime+'n');
		this.beat = -1;

		// bind scrollwheel to sizing anchor nodes
		$(window).on('mousewheel DOMMouseScroll', ::this.handleMousewheel);

		addResizeCallback(::this.handleResize);
		addKeyListener('backspace', ::this.removeActiveNode);
		addKeyListener('delete', ::this.removeActiveNode);
		addKeyListener('esc', ::this.clearActiveNode);
		setTimeout(() => triggerResize(), 10);

		this.mounted = true;
		this.createMissingNodeInstances();
		this.animate();

	}

	handleResize() {
		this.width = this.$container.width();
		this.height = this.$container.height();
		this.offsetY = this.$container.offset().top;
		if(this.renderer) this.renderer.resize(this.width/getPixelDensity(), this.height/getPixelDensity());
	}

	handleMousewheel(event) {
		// disable scroll zoom while dragging / clicking
		if(!this.mouseDown && inBounds(this.cursor, 0, 0, this.width, this.height)) {
			const scrollAmount = event.originalEvent.wheelDelta || event.originalEvent.detail;
			if (scrollAmount !== 0) this.aimScale = clamp(this.aimScale + scrollAmount/200, this.props.minZoom, this.props.maxZoom);
		}
	}

	handlePointerDown(event) {
		this.mouseDown = true;
		this.mouseMoved = false;
		this.dragTarget = null;
		this.mouseDownPosition = new Point(event.data.originalEvent.clientX, event.data.originalEvent.clientY - this.offsetY);
	}

	handlePointerUp(event) {
		this.mouseDown = false;
		this.dragTarget = null;
		if(!this.mouseMoved) {
			if(this.activeNode) this.clearActiveNode();
			else this.createNode(event);
		}
	}

	handlePointerMove(event) {
		// update mouse position vars
		this.cursor = new Point(event.data.originalEvent.clientX, event.data.originalEvent.clientY - this.offsetY);
		this.stageCursor = event.data.getLocalPosition(this.stage);

		// reposition stage pivot to mouse position for zooming
		this.stage.position.x += (this.stageCursor.x - this.stage.pivot.x) * this.stage.scale.x;
		this.stage.position.y += (this.stageCursor.y - this.stage.pivot.y) * this.stage.scale.y;
		this.stage.pivot = this.stageCursor;

		// enforce a minimum distance before allowing panning
		if(this.mouseDown && !this.mouseMoved && this.cursor.distance(this.mouseDownPosition) < 10) return true;
		this.mouseMoved = true;

		if(this.mouseDown) {
			if(this.dragTarget) {
				// reposition node if dragging
				this.dragTarget.position.x += this.stageCursor.x - this.lastStageCursor.x;
				this.dragTarget.position.y += this.stageCursor.y - this.lastStageCursor.y;
				this.handleNodeMove();

				// cancel any scheduled notes
				if(this.dragTarget.nodeType == POINT_NODE && this.dragTarget.scheduledNotes) {
					this.dragTarget.scheduledNotes.forEach(id => Transport.cancel(id));
					this.dragTarget.scheduledNotes = [];
				}else if(this.dragTarget.nodeType == ORIGIN_RING_NODE && this.dragTarget.nearbyPointNodes) {
					for(let nearbyPointNode of this.dragTarget.nearbyPointNodes) {
						if(nearbyPointNode.ref.scheduledNotes) {
							nearbyPointNode.ref.scheduledNotes.forEach(id => Transport.cancel(id));
							nearbyPointNode.ref.scheduledNotes = [];
						}
					}
				}
			}else{
				// pan stage if dragging
				this.stage.position.x += this.cursor.x - this.lastCursor.x;
				this.stage.position.y += this.cursor.y - this.lastCursor.y;
			}
		}

		// set mouse vars for next event
		this.lastCursor = this.cursor;
		this.lastStageCursor = this.stageCursor;
	}

	// called by Tone transport on every beat
	tick() {
		this.beat ++;
		if(this.beat >= this.props.transport.meterBeats) this.beat = 0;
		this.renderer.backgroundColor = this.beat === 0 ? 0x050505 : 0x020202;
		setTimeout(() => this.renderer.backgroundColor = 0x000, 100);
	}

	// creates a node based on current tool selected
	createNode(event) {
		if(!event.target || !event.data) return;
		const spawnPoint = event.data.getLocalPosition(event.target);
		const nodeType = this.props.gui.tool;
		const attrs = {
			id: newId(), 
			position: {x: spawnPoint.x, y: spawnPoint.y},
			noteType: _get(this.props.gui, 'toolSettings.noteType'),
			noteIndex: _get(this.props.gui, 'toolSettings.noteIndex'),
		}
		if(nodeType == ORIGIN_RING_NODE) attrs.synthId = this.props.synths[0].id; // temporary
		this.props.dispatch(createNode(nodeType, attrs));
	}

	// removes node locally and from store given pixi node instance
	removeNode(nodeInstance) {
		if(!nodeInstance) return;
		if(nodeInstance.scheduledNote) {
			console.log('cancelling scheduled notes');
			Transport.cancel(nodeInstance.scheduledNote);
		}
		this.stage.removeChild(nodeInstance);
		this.props.dispatch(removeNode(nodeInstance.nodeType, nodeInstance.id));
		delete this[nodeTypeLookup[nodeInstance.nodeType]][nodeInstance.id];
	}

	// is debounced, updates store with new position
	handleNodeMove(nodeInstance = this.dragTarget) {
		if(!nodeInstance) return;
		const node = getByKey(this.props.stage[nodeTypeLookup[nodeInstance.nodeType]], nodeInstance.id);
		node.position = {x: nodeInstance.position.x, y: nodeInstance.position.y};
		this.props.dispatch(updateNode(nodeInstance.nodeType, node));
	}

	// for setting active node selection
	setActiveNode(nodeInstance) {
		if(!nodeInstance) return;
		const key = nodeTypeLookup[nodeInstance.nodeType];
		const actualNode = getByKey(this.props.stage[key], nodeInstance.id);
		this.activeNode = nodeInstance;
		this.props.dispatch({type: ActionTypes.SET_ACTIVE_NODE, node: actualNode});
	}

	// for clearing active node selection
	clearActiveNode() {
		if(this.props.gui.activeNode) {
			this.props.dispatch({type: ActionTypes.CLEAR_ACTIVE_NODE})
			this.activeNode = null;
		}
	}
	
	// for actually deleting the active node
	removeActiveNode() {
		if(!this.props.gui.activeNode) return;
		this.removeNode(this.activeNode);
		this.clearActiveNode();
	}

	// generate a pixi instance of a node
	createNodeInstance(nodeType, nodeAttrs)  {
		let node = null;
		switch(nodeType) {
			case POINT_NODE: node = createPointNode(nodeAttrs); break;
			case ORIGIN_RING_NODE: node = createRingNode(nodeAttrs); break;
			default: console.log('Failed to create node instance', nodeType, nodeAttrs); return;
		}
		this.stage.addChild(node);
		this[nodeTypeLookup[nodeType]][nodeAttrs.id] = node;
		this.initedNodeIds.push(nodeAttrs.id);
		bindNodeEvents.call(this, nodeType, node, nodeAttrs);
	}

	// go over all node types in stage store and generated new instances where required
	createMissingNodeInstances(stage = this.props.stage) {
		const newNodes = [];
		for(let nodeKey of Object.keys(nodeTypeLookup)) {
			for(let node of stage[nodeTypeLookup[nodeKey]]) {
				if(this.initedNodeIds.indexOf(node.id) < 0) {
					this.createNodeInstance(nodeKey, node);
					newNodes.push(node);
				}
			}
		}
		return newNodes;
	}

	// returns an array of nearby point nodes given a node with a radius attribute
	getNearbyPointNodes(node, pointNodes = this.props.stage.pointNodes) {
		const oldIds = (node.nearbyPointNodes || []).map(item => item.id);
		node.nearbyPointNodes = [];

		for(let pointNodeAttrs of pointNodes) {
			const pointNode = this.pointNodes[pointNodeAttrs.id];
			const distance = new Point(node.position).distance(pointNode.position);
			if(distance <= node.radius) {
				node.nearbyPointNodes.push({
					id: pointNodeAttrs.id, 
					counter: oldIds.indexOf(pointNodeAttrs.id) >= 0 ? node.loopCounter : node.loopCounter-1,
					distance,
					ref: pointNode,
				});
			}
		}
	}

	// called by every ring node at the beginning of its loop
	scheduleRingNodeNotes(ringNodeInstance, ringNode) {
		if(!ringNodeInstance.nearbyPointNodes) this.getNearbyPointNodes(ringNodeInstance);
		for(let nearbyPointNode of ringNodeInstance.nearbyPointNodes) {
			const ticks = Math.floor((nearbyPointNode.distance / BEAT_PX) * METER_TICKS);
			const triggerTime = Transport.toTicks() + ticks;
			const eventId = Transport.scheduleOnce(() => this.triggerNote(ringNode, nearbyPointNode.ref, eventId), triggerTime+'i');
			nearbyPointNode.ref.scheduledNotes.push(eventId);
		}
	}

	checkForNoteReschedule(node) {
		for(let ringNode of this.props.stage.originRingNodes) {
			const ringNodeInstance = this.originRingNodes[ringNode.id];
			const ringSize = BEAT_PX * (ringNodeInstance.loop.progress * (ringNode.bars * ringNode.beats));
			const nearbyPointNode = getByKey(ringNodeInstance.nearbyPointNodes, node.id);
			if(nearbyPointNode && nearbyPointNode.distance > ringSize) {
				const ticks = Math.floor(((nearbyPointNode.distance - ringSize) / BEAT_PX) * METER_TICKS);
				const triggerTime = Transport.toTicks() + ticks;
				const eventId = Transport.scheduleOnce(() => this.triggerNote(ringNode, nearbyPointNode.ref, eventId), triggerTime+'i');
				nearbyPointNode.ref.scheduledNotes.push(eventId);
			}
		}
	}

	triggerNote(originNode, nodeInstance, eventId) {
		const { musicality } = this.props;
		const noteIndex = playNote(nodeInstance, originNode.synthId);
		const ringColor = noteColors[(noteIndex + musicality.scale)%12];
		const ring = createRingFX(nodeInstance.position, ringColor);
		this.fxContainer.addChild(ring);
		this.ringsFX.push(ring);
		if(eventId && nodeInstance.scheduledNotes) nodeInstance.scheduledNotes = nodeInstance.scheduledNotes.filter(id => id != eventId);
	}

	// pixi animation loop
	animate() {
		const { gui, stage, transport, musicality, showFPS } = this.props;
		const { pointNodes, originRingNodes } = stage;

		// active node indiciator
		if(this.activeNode) {
			indicatorOsc = (indicatorOsc + 0.1) % (Math.PI*2);
			this.activeNodeIndicator.renderable = true;
			this.activeNodeIndicator.position = this.activeNode.position;
			this.activeNodeIndicator.scale.set(1 + Math.cos(indicatorOsc)*0.05);
		}else{
			this.activeNodeIndicator.renderable = false;
		}

		// redraw ring nodes
		for(let attrs of originRingNodes) {
			const node = this.originRingNodes[attrs.id];
			const ringSize = BEAT_PX * (node.loop.progress * (attrs.bars * attrs.beats));
			node.ring.clear();
			node.ring.lineStyle(2, 0xFFFFFF, 1);
			node.ring.drawCircle(0, 0, ringSize);
			node.guides.renderable = gui.showGuides;
		}
		
		// render FX rings
		for(let ring of this.ringsFX) {
			ring.scale.set(ring.scale.x + transport.bpm/11000); // just eyeballed this one
			if(++ring.counter >= 60) {
				if(ring.alpha > 0) ring.alpha -= 0.05;
				else this.fxContainer.removeChild(ring);
			}
		}
		// remove invisible rings from array
		this.ringsFX = this.ringsFX.filter(ring => ring.alpha > 0);

		// pan controls
		if(isUpKeyPressed()) this.stage.position.y += scaleEase;
		else if(isDownKeyPressed()) this.stage.position.y -= scaleEase;
		if(isLeftKeyPressed()) this.stage.position.x += scaleEase;
		else if(isRightKeyPressed()) this.stage.position.x -= scaleEase;
		
		// scale easing
		const stageScale = this.stage.scale.x;
		this.stage.scale.set(stageScale + (this.aimScale - stageScale)/scaleEase);

		if(showFPS) {
			const now = Date.now();
			const currentFps = 1/(now-this.lastFps)*1000;
			this.fpsCache.push(currentFps);
			this.fpsCache.shift();
			const fps = this.fpsCache.reduce((prev, current) => prev+current, 0)/this.fpsCache.length;
			this.fps.text = Math.round(fps);
			this.lastFps = now;
		}

		// render and animation loop 
		this.renderer.render(this.stageWrapper);
		if(transport.playing) requestAnimationFrame(this.animate.bind(this));
	}

	// this lifecycle event is primarily used for updating pixi instances where needed when the store changes
	componentWillReceiveProps(nextProps) {

		// force animation to start again if props updates
		if(nextProps.transport.playing && !this.props.transport.playing) {
			setTimeout(() => this.animate());
			this.beat = -1;
			this.loop.start(0);
		}else if(!nextProps.transport.playing && this.props.transport.playing) {
			this.loop.stop();
		}

		// redraw coloured nodes if scale or mode changes
		if(checkDifferenceAny(this.props, nextProps, ['musicality.scale', 'musicality.modeString'])) {
			for(let pointNode of nextProps.stage.pointNodes) {
				if(pointNode.noteType == NoteTypes.NOTE) {
					redrawPointNode(pointNode, this.pointNodes[pointNode.id]);
				}
			}
		}

		// check if length of any node arrays changed, if so do any relevant updates
		if(checkDifferenceAny(this.props, nextProps, nodeTypeKeys.map(key => 'stage.'+key+'.length'))) {
			
			// create missing pixi node instances -- returns the nodes that are new (not the instances)
			const newNodes = this.createMissingNodeInstances(nextProps.stage);

			// iterate over ring nodes
			for(let ringNode of nextProps.stage.originRingNodes) {
				const ringNodeInstance = this.originRingNodes[ringNode.id];
				const ringSize = BEAT_PX * (ringNodeInstance.loop.progress * (ringNode.bars * ringNode.beats));
				this.getNearbyPointNodes(ringNodeInstance, nextProps.stage.pointNodes);

				// check if new node (if a point node) is yet to be crossed by a ring node, if so schedule specifically for it
				for(let newNode of newNodes) {
					const nearbyPointNode = getByKey(ringNodeInstance.nearbyPointNodes, newNode.id);
					if(nearbyPointNode && nearbyPointNode.distance > ringSize) {
						const ticks = Math.floor(((nearbyPointNode.distance - ringSize) / BEAT_PX) * METER_TICKS);
						const triggerTime = Transport.toTicks() + ticks;
						const eventId = Transport.scheduleOnce(() => this.triggerNote(ringNode, nearbyPointNode.ref, eventId, eventId), triggerTime+'i');
						nearbyPointNode.ref.scheduledNotes.push(eventId);
					}
				}
			}
		}

		// update active node if relevant
		// the alternative would be to deep-check all nodes, this is cheaper, simpler and just as effective
		const activeNode = this.props.gui.activeNode;
		const nextActiveNode = nextProps.gui.activeNode;
		if(activeNode && nextActiveNode && activeNode.id == nextActiveNode.id) {
			const key = nodeTypeLookup[nextActiveNode.nodeType];
			if(checkDifferenceAny(activeNode, nextActiveNode, ['noteType', 'noteIndex'])) {
				redrawPointNode(nextActiveNode, this[key][nextActiveNode.id]);
			}else if(checkDifferenceAny(activeNode, nextActiveNode, ['bars', 'beats'])) {
				const ringNode = this[key][nextActiveNode.id];
				redrawRingGuides(nextActiveNode, ringNode);
				ringNode.loop.interval = '0:'+(nextActiveNode.bars * nextActiveNode.beats)+':0';
			}
		}

		// the only thing that should be updating in the store while dragging a node is the node's position
		// so assuming that, we can recalculate note schedules for the node being dragged
		// this saves having to deep-check positions of all nodes
		if(this.dragTarget) {
			const node = getByKey(nextProps.stage[nodeTypeLookup[this.dragTarget.nodeType]], this.dragTarget.id);
			if(node) {
				// if moving a point or ring node, update ring node nearby points
				if(node.nodeType == POINT_NODE) {
					console.log('point node moved -- recalculating note schedules');
					for(let ringNode of nextProps.stage.originRingNodes) {
						const ringNodeInstance = this.originRingNodes[ringNode.id];
						this.getNearbyPointNodes(ringNodeInstance, nextProps.stage.pointNodes);
						this.checkForNoteReschedule(node);
					}
				}else if(node.nodeType == ORIGIN_RING_NODE) {
					console.log('ring node moved -- recalculating surround note schedules');
					const ringNodeInstance = this.originRingNodes[node.id];
					this.getNearbyPointNodes(ringNodeInstance, nextProps.stage.pointNodes);
					for(let pointNode of nextProps.stage.pointNodes) {
						this.checkForNoteReschedule(pointNode);
					}
				}
			}
		}
	}

	shouldComponentUpdate() {
		return !this.mounted;
	}

	render() {
		return (
			<div className="primary-interface" ref="container"></div>
		)
	}

}

export default connect(({gui, stage, musicality, synths, transport}) => ({gui, stage, musicality, synths, transport}))(PrimaryInterface)

