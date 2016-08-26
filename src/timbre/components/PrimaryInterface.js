import React, { Component } from 'react'
import { connect } from 'react-redux'
import PIXI, { Container, Graphics, Sprite } from 'pixi.js'
import { Loop } from 'tone'
import _throttle from 'lodash/throttle'
import _get from 'lodash/get'
import $ from 'jquery'

import Point from '../Point'
import newId from '../utils/newId'
import { dist, clamp, inBounds } from '../utils/mathUtils'
import { checkDifferenceAny } from '../utils/lifecycleUtils'
import { getPixelDensity, addResizeCallback, triggerResize } from '../utils/screenUtils'
import { isUpKeyPressed, isDownKeyPressed, isLeftKeyPressed, isRightKeyPressed, addKeyListener } from '../utils/keyUtils'

import { beatPX } from '../constants/globals'
import noteColors from '../constants/noteColors'
import * as NoteTypes from '../constants/noteTypes'
import * as ActionTypes from '../constants/actionTypes'
import { bindNodeEvents } from '../nodeEventHandlers'
import { createNode, removeNode } from '../reducers/stage'
import { getRandomNote, getAscendingNote, getDescendingNote, playNote } from '../sound'
import { redrawPointNode, redrawRingGuides } from '../nodeGraphics'
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
	};

	constructor(props) {
		super(props);
		this.handlePointerMove = _throttle(this.handlePointerMove, mouseMoveThrottle);
		this.handleMousewheel = _throttle(this.handleMousewheel, scrollwheelThrottle);
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
		this.generateNodeInstances();
		this.animate();

	}

	handleResize() {
		this.width = this.$container.width();
		this.height = this.$container.height();
		this.offsetY = this.$container.offset().top;
		if(this.renderer) this.renderer.resize(this.width/getPixelDensity(), this.height/getPixelDensity());
		console.log(this.width, this.height);
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
	}

	handlePointerUp(event) {
		this.mouseDown = false;
		if(!this.mouseMoved) {
			if(this.activeNode) this.clearActiveNode();
			else this.createNode(event);
		}
	}

	handlePointerMove(event) {
		// update last mouse vars
		this.mouseMoved = true;
		this.lastCursor = this.cursor;
		this.lastStageCursor = this.stageCursor;
		
		// update mouse vars
		this.cursor = new Point(event.data.originalEvent.clientX, event.data.originalEvent.clientY - this.offsetY);
		this.stageCursor = event.data.getLocalPosition(this.stage);
		
		// reposition stage pivot to mouse position for zooming
		this.stage.position.x += (this.stageCursor.x - this.stage.pivot.x) * this.stage.scale.x;
		this.stage.position.y += (this.stageCursor.y - this.stage.pivot.y) * this.stage.scale.y;
		this.stage.pivot = this.stageCursor;

		// pan stage if dragging
		if(this.mouseDown) {
			this.stage.position.x += this.cursor.x - this.lastCursor.x;
			this.stage.position.y += this.cursor.y - this.lastCursor.y;
		}
	}

	tick() {
		this.beat ++;
		if(this.beat >= this.props.transport.meterBeats) this.beat = 0;
		this.renderer.backgroundColor = this.beat === 0 ? 0x050505 : 0x020202;
		setTimeout(() => this.renderer.backgroundColor = 0x000, 100);
	}

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
		if(nodeType == ORIGIN_RING_NODE) attrs.synthId = this.props.synths[0].id;
		this.props.dispatch(createNode(nodeType, attrs));
	}

	removeNode(nodeInstance) {
		this.stage.removeChild(nodeInstance);
		// todo: remove from class arrays
		this.props.dispatch(removeNode(nodeInstance.nodeType, nodeInstance.id));
	}

	// for setting active node selection
	setActiveNode(nodeInstance) {
		const key = nodeTypeLookup[nodeInstance.nodeType];
		const actualNode = this.props.stage[key].reduce((prev, node) => (!prev && node.id == nodeInstance.id) ? node : prev, null);
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
		bindNodeEvents.call(this, nodeType, node);
	}

	// go over all node types in stage store and check if an instance has been generated
	generateNodeInstances(stage = this.props.stage) {
		for(let nodeKey of Object.keys(nodeTypeLookup)) {
			for(let node of stage[nodeTypeLookup[nodeKey]]) {
				if(this.initedNodeIds.indexOf(node.id) < 0) {
					this.createNodeInstance(nodeKey, node);
				}
			}
		}
	}

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

	animate() {

		const { gui, stage, transport, musicality } = this.props;
		const { pointNodes, originRingNodes } = stage;
		const elapsed = Date.now() - transport.startTime;
		const beatMS = (1000*60)/transport.bpm; // idk why divide 2 okay

		// active node indiciator
		if(this.activeNode) {
			indicatorOsc = (indicatorOsc + 0.1) % (Math.PI*2);
			this.activeNodeIndicator.alpha = 1;
			this.activeNodeIndicator.position = this.activeNode.position;
			this.activeNodeIndicator.scale.set(1 + Math.cos(indicatorOsc)*0.05);
		}else{
			this.activeNodeIndicator.alpha = 0;
		}

		for(let attrs of originRingNodes) {
			const node = this.originRingNodes[attrs.id];
			const loopTime = beatMS * node.totalBeats;
			const currentTime = elapsed % loopTime;
			const percent = currentTime/loopTime;
			const ringSize = beatPX * (percent*node.totalBeats);
			node.ring.clear();
			node.ring.lineStyle(2, 0xFFFFFF, 1);
			node.ring.drawCircle(0, 0, ringSize);

			if(!node.nearbyPointNodes) this.getNearbyPointNodes(node);
			if(ringSize < node.lastRingSize) node.loopCounter ++;
			for(let nearbyPointNode of node.nearbyPointNodes) {
				if(nearbyPointNode.distance <= ringSize && nearbyPointNode.counter < node.loopCounter) {
					nearbyPointNode.counter = node.loopCounter;
					const noteIndex = playNote(nearbyPointNode.ref, attrs.synthId);
					const ring = new Graphics();
					const ringColor = noteColors[(noteIndex + musicality.scale)%12];
					ring.lineStyle(3, ringColor, 1);
					ring.drawCircle(0, 0, beatPX*3);
					ring.cacheAsBitmap = true;
					ring.scale.set(0);
					ring.position = nearbyPointNode.ref.position;
					ring.counter = 0;
					this.fxContainer.addChild(ring);
					this.ringsFX.push(ring);
				}
			}

			node.lastRingSize = ringSize;

		}
		
		// render FX rings
		for(let i=0; i < this.ringsFX.length; i ++) {
			const ring = this.ringsFX[i];
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

		// render and animation loop 
		this.renderer.render(this.stage);
		if(transport.playing) requestAnimationFrame(this.animate.bind(this));
	}

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

		// check if length of any node arrays changed, if so do an update
		if(checkDifferenceAny(this.props, nextProps, nodeTypeKeys.map(key => 'stage.'+key+'.length'))) {
			this.generateNodeInstances(nextProps.stage);
			for(let attrs of nextProps.stage.originRingNodes) {
				const node = this.originRingNodes[attrs.id];
				this.getNearbyPointNodes(node, nextProps.stage.pointNodes);
			}
		}

		// update active node if relevant
		const activeNode = this.props.gui.activeNode;
		const nextActiveNode = nextProps.gui.activeNode;
		if(activeNode && nextActiveNode && activeNode.id == nextActiveNode.id) {
			const key = nodeTypeLookup[nextActiveNode.nodeType];
			if(checkDifferenceAny(activeNode, nextActiveNode, ['noteType', 'noteIndex'])) {
				redrawPointNode(nextActiveNode, this[key][nextActiveNode.id]);
			}else if(checkDifferenceAny(activeNode, nextActiveNode, ['bars', 'beats'])) {
				redrawRingGuides(nextActiveNode, this[key][nextActiveNode.id]);
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

