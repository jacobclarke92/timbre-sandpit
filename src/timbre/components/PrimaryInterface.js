import React, { Component } from 'react'
import { connect } from 'react-redux'
import PIXI, { Container, Graphics, Sprite, Text } from 'pixi.js'
import Tone, { Loop, Transport } from 'tone'
import _throttle from 'lodash/throttle'
import _debounce from 'lodash/debounce'
import _get from 'lodash/get'
import $ from 'jquery'

import ArcNode from './nodes/ArcNode'
import PointNode from './nodes/PointNode'
import OriginRingNode from './nodes/OriginRingNode'
import OriginRadarNode from './nodes/OriginRadarNode'

import FpsCounter from './nodes/FpsCounter'
import PlacementIndicator from './nodes/PlacementIndicator'
import ActiveNodeIndicator from './nodes/ActiveNodeIndicator'
import PrimaryInterfaceStage from './PrimaryInterfaceStage'
import PrimaryInterfaceRenderer from './PrimaryInterfaceRenderer'

import Point from '../Point'
import newId from '../utils/newId'
import { getValueById } from '../utils/arrayUtils'
import { checkDifferenceAny } from '../utils/lifecycleUtils'
import { dist, clamp, inBounds, getDistance, getAngle } from '../utils/mathUtils'
import { getPixelDensity, addResizeCallback, triggerResize } from '../utils/screenUtils'
import { isUpKeyPressed, isDownKeyPressed, isLeftKeyPressed, isRightKeyPressed, addKeyListener } from '../utils/keyUtils'

import noteColors from '../constants/noteColors'
import * as NoteTypes from '../constants/noteTypes'
import * as ActionTypes from '../constants/actionTypes'
import { bindNodeEvents } from '../nodeEventHandlers'
import { BEAT_PX, METER_TICKS } from '../constants/globals'
import { createNode, removeNode, updateNode } from '../reducers/stage'
import { getRandomNote, getAscendingNote, getDescendingNote, playNote } from '../sound'
import { createPointNode, createRingNode, createArcNode, createRadarNode } from '../nodeGenerators'
import { createRingFX, redrawPointNode, redrawRingGuides, redrawRadarGuides } from '../nodeGraphics'
import { nodeTypeLookup, nodeTypeKeys, POINT_NODE, ARC_NODE, ORIGIN_RING_NODE, ORIGIN_RADAR_NODE } from '../constants/nodeTypes'

const scaleEase = 10;
const mouseMoveThrottle = 1000/50; // 50fps
const scrollwheelThrottle = 1000/50; // 50fps
let indicatorOsc = 0;

class PrimaryInterface extends Component {

	static defaultProps = {
		maxZoom: 2,
		minZoom: 0.2,
		showDebugDots: false,
		showFPS: true,
	};

	constructor(props) {
		super(props);
		this.handlePointerMove = _throttle(this.handlePointerMove.bind(this), mouseMoveThrottle);
		this.handleMousewheel = _throttle(this.handleMousewheel, scrollwheelThrottle);
		this.handleNodeMove = _debounce(this.handleNodeMove, 50);
		this.handlePointerDown = this.handlePointerDown.bind(this);
		this.handlePointerUp = this.handlePointerUp.bind(this);

		this.state = {
			offsetY: 136,
			pointer: new Point(0,0),
			stagePointer: new Point(0,0),
			mouseDown: false,
			mouseMoved: false,
			mouseDownPosition: new Point(0,0),
			dragTarget: null,
			activeTarget: null,
			activeNode: null,
		}
	}

	componentDidMount() {

		/*
		// get initial dimensions
		this.handleResize();
		this.$container = $(this.refs.container);
			
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
			this.fps.scale.set(1/getPixelDensity());
			this.fps.position = {x: 5, y: 5};
			this.fpsCache = new Array(60).map(t => 60);
			this.lastFps = Date.now();
			// wait for font to load / fps to stabilize
			setTimeout(() => this.stageWrapper.addChild(this.fps), 1000); 
		}

		// placement indicator
		this.placementIndicator = new Graphics();
		this.placementIndicator.lineStyle(2, 0xFFFFFF, 0.5);
		this.placementIndicator.moveTo(0, -15);
		this.placementIndicator.lineTo(0, 15);
		this.placementIndicator.moveTo(-15, 0);
		this.placementIndicator.lineTo(15, 0);
		this.placementIndicator.cacheAsBitmap = true;
		this.stage.addChild(this.placementIndicator);

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
		this.placementPosition = new Point(0,0);

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
		*/

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
		console.log('mousedown');
		this.setState({
			mouseDown: true,
			mouseMoved: false,
			dragTarget: null,
			mouseDownPosition: new Point(event.data.originalEvent.clientX, event.data.originalEvent.clientY - this.state.offsetY),
		});
	}

	handlePointerUp(event) {
		console.log('mouseup');
		this.setState({
			mouseDown: false,
			dragTarget: null,
		});
		if(!this.state.mouseMoved) {
			if(this.state.activeNode) this.clearActiveNode();
			else this.createNode(event);
		}
	}

	handlePointerMove(event) {
		const { snapping } = this.props.gui;

		/*
		// update mouse position vars
		this.cursor = new Point(event.data.originalEvent.clientX, event.data.originalEvent.clientY - this.offsetY);
		this.stageCursor = event.data.getLocalPosition(this.stage);
		*/
		const pointer = new Point(event.data.originalEvent.clientX, event.data.originalEvent.clientY - this.offsetY);
		const stagePointer = event.data.getLocalPosition(event.target);
		const placementPosition = stagePointer;
		this.setState({
			pointer,
			stagePointer,
			placementPosition,
		});

		/*
		// placement snapping
		if(snapping) {
			const closestNode = this.getClosestOriginNode(this.stageCursor);
			if(closestNode) {
				const angle = getAngle(closestNode.node.position, this.stageCursor);
				if(closestNode.node.nodeType == ORIGIN_RING_NODE) {
					const distance = Math.round(closestNode.distance / BEAT_PX) * BEAT_PX - 0.1;
					this.placementPosition = {
						x: closestNode.node.position.x + Math.cos(angle)*distance,
						y: closestNode.node.position.y + Math.sin(angle)*distance,
					};
				}else if(closestNode.node.nodeType == ORIGIN_RADAR_NODE) {
					const absAngle = angle+Math.PI;
					const anglePart = (Math.PI*2)/(closestNode.node.bars*closestNode.node.beats);
					const angleSnap = Math.round(absAngle / anglePart) * anglePart - Math.PI;
					this.placementPosition = {
						x: closestNode.node.position.x + Math.cos(angleSnap)*closestNode.distance,
						y: closestNode.node.position.y + Math.sin(angleSnap)*closestNode.distance,
					}
				}
			}else{
				this.placementPosition = {
					x: Math.round(this.stageCursor.x / BEAT_PX) * BEAT_PX, 
					y: Math.round(this.stageCursor.y / BEAT_PX) * BEAT_PX,
				};
			}
		}else{
			this.placementPosition = this.stageCursor;
		}

		// reposition stage pivot to mouse position for zooming
		this.stage.position.x += (this.stageCursor.x - this.stage.pivot.x) * this.stage.scale.x;
		this.stage.position.y += (this.stageCursor.y - this.stage.pivot.y) * this.stage.scale.y;
		this.stage.pivot = this.stageCursor;
		
		*/
		const { mouseDown, mouseMoved, mouseDownPosition, dragTarget } = this.state;
		// enforce a minimum distance before allowing panning
		if(mouseDown && !mouseMoved && pointer.distance(mouseDownPosition) < 10) return true;

		this.setState({
			mouseMoved: true,
		})

		if(mouseDown) {
			if(dragTarget) {
				// reposition node if dragging
				dragTarget.position.x = snapping ? placementPosition.x : stagePointer.x;
				dragTarget.position.y = snapping ? placementPosition.y : stagePointer.y;
				this.handleNodeMove();

				// cancel any scheduled notes
				if(dragTarget.nodeType == POINT_NODE && dragTarget.scheduledNotes) {
					this.clearScheduledNotes(this.dragTarget);
					dragTarget.scheduledNotes = {};
				}else if((dragTarget.nodeType == ORIGIN_RING_NODE || dragTarget.nodeType == ORIGIN_RADAR_NODE) && dragTarget.nearbyPointNodes) {
					for(let nearbyPointNode of dragTarget.nearbyPointNodes) {
						this.clearScheduledNotes(nearbyPointNode.ref);
						nearbyPointNode.ref.scheduledNotes = {};
					}
				}
			}else{
				// pan stage if dragging
				// this.stage.position.x += this.cursor.x - this.lastCursor.x;
				// this.stage.position.y += this.cursor.y - this.lastCursor.y;
			}
		}

		// set mouse vars for next event
		// this.lastCursor = this.cursor;
		// this.lastStageCursor = this.stageCursor;
	}

	// called by Tone transport on every beat
	tick() {
		this.beat ++;
		if(this.beat >= this.props.transport.meterBeats) this.beat = 0;
		this.renderer.backgroundColor = this.beat === 0 ? 0x050505 : 0x020202;
		setTimeout(() => this.renderer.backgroundColor = 0x000, 100);
	}

	handleNodePointerDown(event) {
		event.stopPropagation();
		this.setState({
			mouseMoved: false,
			mouseDown: true,
			dragTarget: event.target,
		});
	}

	handleNodePointerUp(event) {
		console.log('mouse up');
		event.stopPropagation();
		if(event.target) {
			event.stopPropagation();
			if(!this.state.mouseMoved) {
				this.setActiveNode(event.target);
			}else if(this.state.dragTarget) {
				this.setState({dragTarget: null});
			}
		}

		this.setState({
			mouseMoved: false,
			mouseDown: false,
		});
	}

	getClosestOriginNode(point) {
		const { originRingNodes, originRadarNodes } = this.props.stage;
		const nodes = [];
		for(let node of originRingNodes) {
			const distance = getDistance(point, node.position);
			if(distance <= node.bars*node.beats*BEAT_PX) nodes.push({node, distance});
		}
		for(let node of originRadarNodes) {
			const distance = getDistance(point, node.position);
			if(distance <= node.radius) nodes.push({node, distance});
		}
		nodes.sort((a,b) => a.distance < b.distance ? -1 : (a.distance > b.distance ? 1 : 0))
		return nodes.length > 0 ? nodes[0] : null;
	}

	// creates a node based on current tool selected
	createNode(event) {
		if(!event.target || !event.data) return;
		const spawnPoint = this.props.gui.snapping ? this.placementPosition : event.data.getLocalPosition(event.target);
		const nodeType = this.props.gui.tool;
		const attrs = {
			id: newId(), 
			position: {x: spawnPoint.x, y: spawnPoint.y},
			noteType: _get(this.props.gui, 'toolSettings.noteType'),
			noteIndex: _get(this.props.gui, 'toolSettings.noteIndex'),
		}
		if(nodeType == ORIGIN_RING_NODE || nodeType == ORIGIN_RADAR_NODE) attrs.synthId = this.props.synths[0].id; // temporary
		this.props.dispatch(createNode(nodeType, attrs));
	}

	// removes node locally and from store given pixi node instance
	removeNode(nodeInstance) {
		if(!nodeInstance) return;
		if(nodeInstance.loop) {
			nodeInstance.loop.cancel();
			nodeInstance.loop.dispose();
		}
		this.clearScheduledNotes(nodeInstance);
		this.stage.removeChild(nodeInstance);
		this.props.dispatch(removeNode(nodeInstance.nodeType, nodeInstance.id));
		delete this[nodeTypeLookup[nodeInstance.nodeType]][nodeInstance.id];
	}

	// is debounced, updates store with new position
	handleNodeMove(nodeInstance = this.dragTarget) {
		if(!nodeInstance) return;
		const node = getValueById(this.props.stage[nodeTypeLookup[nodeInstance.nodeType]], nodeInstance.id);
		node.position = {x: nodeInstance.position.x, y: nodeInstance.position.y};
		this.props.dispatch(updateNode(nodeInstance.nodeType, node));
	}

	// for setting active node selection
	setActiveNode(nodeInstance) {
		if(!nodeInstance) return;
		const key = nodeTypeLookup[nodeInstance.nodeType];
		const actualNode = getValueById(this.props.stage[key], nodeInstance.id);
		this.setState({activeNode: nodeInstance});
		this.props.dispatch({type: ActionTypes.SET_ACTIVE_NODE, node: actualNode});
	}

	// for clearing active node selection
	clearActiveNode() {
		if(this.props.gui.activeNode) {
			this.props.dispatch({type: ActionTypes.CLEAR_ACTIVE_NODE})
			this.setState({activeNode: null});
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
			case ORIGIN_RADAR_NODE: node = createRadarNode(nodeAttrs); break;
			default: console.log('Failed to create node instance', nodeType, nodeAttrs); return;
		}
		this.stage.addChild(node);
		this[nodeTypeLookup[nodeType]][nodeAttrs.id] = node;
		this.initedNodeIds.push(nodeAttrs.id);
		bindNodeEvents.call(this, nodeType, node, nodeAttrs);
	}

	// go over all node types in stage store and generated new instances where required
	createMissingNodeInstances(stage = this.props.stage) {
		const newNodes = {};
		for(let nodeKey of Object.keys(nodeTypeLookup)) {
			newNodes[nodeKey] = [];
			for(let node of stage[nodeTypeLookup[nodeKey]]) {
				if(this.initedNodeIds.indexOf(node.id) < 0) {
					this.createNodeInstance(nodeKey, node);
					newNodes[nodeKey].push(node);
				}
			}
		}
		return newNodes;
	}

	// returns an array of nearby point nodes given a node with a radius attribute
	getNearbyPointNodes(node, pointNodes = this.props.stage.pointNodes) {
		node.nearbyPointNodes = [];
		for(let pointNodeAttrs of pointNodes) {
			const pointNode = this.pointNodes[pointNodeAttrs.id];
			const distance = getDistance(node.position, pointNode.position);
			const angle = getAngle(node.position, pointNode.position) + Math.PI;
			if(distance <= node.radius) {
				node.nearbyPointNodes.push({
					id: pointNodeAttrs.id, 
					ref: pointNode,
					distance,
					angle,
				});
			}
		}
	}

	// called whenever a note needs to be scheduled
	// registers it to the target's scheduledNotes array under the source's id
	scheduleNote(originNode, nodeInstance, ticks = Transport.toTicks()) {
		if(!originNode || !nodeInstance) return;
		const eventId = Transport.scheduleOnce(() => this.triggerNote(originNode, nodeInstance, eventId), ticks+'i');
		if(!nodeInstance.scheduledNotes[originNode.id]) nodeInstance.scheduledNotes[originNode.id] = [];
		nodeInstance.scheduledNotes[originNode.id].push(eventId);
	}

	// called by every ring node at the beginning of its loop
	scheduleRingNodeNotes(ringNodeInstance, ringNode) {
		if(!ringNodeInstance.nearbyPointNodes) this.getNearbyPointNodes(ringNodeInstance);
		for(let nearbyPointNode of ringNodeInstance.nearbyPointNodes) {
			const ticks = ((nearbyPointNode.distance / BEAT_PX) * METER_TICKS)/ringNodeInstance.loop.playbackRate;
			const triggerTime = Transport.toTicks() + Math.floor(ticks);
			this.scheduleNote(ringNode, nearbyPointNode.ref, triggerTime);
		}
	}

	// called by every radar node at the beginning of its loop
	scheduleRadarNodeNotes(radarNodeInstance, radarNode) {
		if(!radarNodeInstance.nearbyPointNodes) this.getNearbyPointNodes(radarNodeInstance);
		for(let nearbyPointNode of radarNodeInstance.nearbyPointNodes) {
			const totalBeats = radarNode.bars * radarNode.beats;
			const ticks = ((nearbyPointNode.angle / (Math.PI*2)) * totalBeats * METER_TICKS) / radarNodeInstance.loop.playbackRate;
			const triggerTime = Transport.toTicks() + Math.floor(ticks);
			this.scheduleNote(radarNode, nearbyPointNode.ref, triggerTime);
		}
	}

	// called when a node has been moved
	checkForNoteReschedule(node) {
		for(let ringNode of this.props.stage.originRingNodes) {
			const ringNodeInstance = this.originRingNodes[ringNode.id];
			const ringSize = BEAT_PX * (ringNodeInstance.loop.progress * (ringNode.bars * ringNode.beats));
			const nearbyPointNode = getValueById(ringNodeInstance.nearbyPointNodes, node.id);
			if(nearbyPointNode && nearbyPointNode.distance > ringSize) {
				const ticks = Math.floor(((nearbyPointNode.distance - ringSize) / BEAT_PX) * METER_TICKS);
				const triggerTime = Transport.toTicks() + ticks;
				this.scheduleNote(ringNode, nearbyPointNode.ref, triggerTime);
			}
		}
		for(let radarNode of this.props.stage.originRadarNodes) {
			const radarNodeInstance = this.originRadarNodes[radarNode.id];
			const radarAngle = radarNodeInstance.loop.progress * (Math.PI*2);
			const totalBeats = radarNode.bars * radarNode.beats;
			const nearbyPointNode = getValueById(radarNodeInstance.nearbyPointNodes, node.id);
			if(nearbyPointNode && nearbyPointNode.angle > radarAngle) {
				const ticks = Math.floor(((nearbyPointNode.angle / (Math.PI*2)) * totalBeats * METER_TICKS) / radarNodeInstance.loop.playbackRate);
				const triggerTime = Transport.toTicks() + ticks;
				this.scheduleNote(radarNode, nearbyPointNode.ref, triggerTime);
			}
		}
	}

	// called on node delete of any kind
	clearScheduledNotes(nodeInstance) {
		/*
		switch(nodeInstance.nodeType) {
			case POINT_NODE:
				for(let key of Object.keys(nodeInstance.scheduledNotes)) {
					nodeInstance.scheduledNotes[key].forEach(noteId => Transport.cancel(noteId));
					nodeInstance.scheduledNotes[key] = [];
				}
				break;

			case ORIGIN_RING_NODE:
			case ORIGIN_RADAR_NODE:
				if(nodeInstance.nearbyPointNodes) nodeInstance.nearbyPointNodes.forEach(npn => {
					if(npn.ref.scheduledNotes[nodeInstance.id]) {
						npn.ref.scheduledNotes[nodeInstance.id].forEach(noteId => Transport.cancel(noteId));
						npn.ref.scheduledNotes[nodeInstance.id] = [];
					}
				});
				break;
		}
		*/
	}

	// clear all scheduled notes originating from a specific source
	clearScheduledNotesFromSource(sourceInstance, pointNodes = this.props.stage.pointNodes) {
		for(let pointNode of pointNodes) {
			const pointInstance = this.pointNodes[pointNode.id];
			if(pointInstance.scheduledNotes && pointInstance.scheduledNotes[sourceInstance.id]) {
				pointInstance.scheduledNotes[sourceInstance.id].forEach(noteId => Transport.cancel(noteId));
				pointInstance.scheduledNotes[sourceInstance.id] = [];
			}
		}
	}

	// plays a note!
	triggerNote(originNode, nodeInstance, eventId) {
		const { musicality, stage } = this.props;
		const node = getValueById(stage[nodeTypeLookup[nodeInstance.nodeType]], nodeInstance.id);
		if(!node) return;
		const noteIndex = playNote(node, originNode.synthId);
		const ringColor = noteColors[(noteIndex + musicality.scale)%12];
		const ring = createRingFX(nodeInstance.position, ringColor);
		ring.speed = originNode.speed;
		this.fxContainer.addChild(ring);
		this.ringsFX.push(ring);
		
		// remove scheduled event id from note
		if(eventId && nodeInstance.scheduledNotes[originNode.id]) {
			nodeInstance.scheduledNotes[originNode.id] = nodeInstance.scheduledNotes[originNode.id].filter(id => id != eventId);
		}
	}

	// pixi animation loop
	animate() {
		const { gui, stage, transport, musicality, showFPS } = this.props;
		const { pointNodes, originRingNodes, originRadarNodes } = stage;

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

		// redraw radar nodes
		for(let attrs of originRadarNodes) {
			const node = this.originRadarNodes[attrs.id];
			const theta = node.loop.progress * (Math.PI*2) + Math.PI;
			node.graphic.clear();
			node.graphic.lineStyle(2, 0xFFFFFF, 1);
			node.graphic.moveTo(0,0);
			node.graphic.lineTo(Math.cos(theta)*attrs.radius, Math.sin(theta)*attrs.radius);
			node.guides.renderable = gui.showGuides;
		}
		
		// render FX rings
		for(let ring of this.ringsFX) {
			ring.scale.set(ring.scale.x + (transport.bpm/11000)*ring.speed); // just eyeballed this one
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

		// placement indicator
		this.placementIndicator.position = this.placementPosition;
		this.placementIndicator.scale.set(1/this.stage.scale.x);

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

		/*
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
			console.log(newNodes);

			// iterate over ring nodes
			for(let ringNode of nextProps.stage.originRingNodes) {
				const ringNodeInstance = this.originRingNodes[ringNode.id];
				const ringSize = BEAT_PX * (ringNodeInstance.loop.progress * (ringNode.bars * ringNode.beats));
				this.getNearbyPointNodes(ringNodeInstance, nextProps.stage.pointNodes);

				// check if new node (if a point node) is yet to be crossed by a ring node, if so schedule specifically for it
				for(let newNode of newNodes[POINT_NODE]) {
					const nearbyPointNode = getValueById(ringNodeInstance.nearbyPointNodes, newNode.id);
					if(nearbyPointNode && nearbyPointNode.distance > ringSize) {
						const ticks = Math.floor(((nearbyPointNode.distance - ringSize) / BEAT_PX) * METER_TICKS);
						const triggerTime = Transport.toTicks() + ticks;
						this.scheduleNote(ringNode, nearbyPointNode.ref, triggerTime);
					}
				}
			}

			for(let radarNode of nextProps.stage.originRadarNodes) {
				const radarNodeInstance = this.originRadarNodes[radarNode.id];
				const radarAngle = radarNodeInstance.loop.progress * (Math.PI*2);
				const totalBeats = radarNode.bars * radarNode.beats;
				this.getNearbyPointNodes(radarNodeInstance, nextProps.stage.pointNodes);

				// check if new node (if a point node) is yet to be crossed by a radar node, if so schedule specifically for it
				for(let newNode of newNodes[POINT_NODE]) {
					const nearbyPointNode = getValueById(radarNodeInstance.nearbyPointNodes, newNode.id);
					if(nearbyPointNode && nearbyPointNode.angle > radarAngle) {
						const ticks = Math.floor((((nearbyPointNode.angle - radarAngle) / (Math.PI*2)) * totalBeats * METER_TICKS) / radarNodeInstance.loop.playbackRate);
						const triggerTime = Transport.toTicks() + ticks;
						this.scheduleNote(radarNode, nearbyPointNode.ref, triggerTime);
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
			switch(activeNode.nodeType) {
				case POINT_NODE:
					if(checkDifferenceAny(activeNode, nextActiveNode, ['noteType', 'noteIndex'])) {
						redrawPointNode(nextActiveNode, this[key][nextActiveNode.id]);
					}	
					break;
				case ORIGIN_RING_NODE:
					const ringNode = this[key][nextActiveNode.id];
					if(checkDifferenceAny(activeNode, nextActiveNode, ['bars', 'beats'])) {
						redrawRingGuides(nextActiveNode, ringNode);
						ringNode.loop.interval = '0:'+(nextActiveNode.bars * nextActiveNode.beats)+':0';
					}
					if(activeNode.speed != nextActiveNode.speed) ringNode.loop.playbackRate = nextActiveNode.speed;
					break;
				case ORIGIN_RADAR_NODE:
					const radarNode = this[key][nextActiveNode.id];
					if(checkDifferenceAny(activeNode, nextActiveNode, ['bars', 'beats', 'radius'])) {
						redrawRadarGuides(nextActiveNode, radarNode);
						radarNode.loop.interval = '0:'+(nextActiveNode.bars * nextActiveNode.beats)+':0';
					}
					if(activeNode.speed != nextActiveNode.speed) radarNode.loop.playbackRate = nextActiveNode.speed;
					break;
			}
		}

		// the only thing that should be updating in the store while dragging a node is the node's position
		// so assuming that, we can recalculate note schedules for the node being dragged
		// this saves having to deep-check positions of all nodes
		if(this.dragTarget) {
			const node = getValueById(nextProps.stage[nodeTypeLookup[this.dragTarget.nodeType]], this.dragTarget.id);
			if(node) {
				switch(node.nodeType) {
					case POINT_NODE:
						console.log('point node moved -- recalculating note schedules');
						this.clearScheduledNotes(this.dragTarget, nextProps.stage.pointNodes);
						for(let ringNode of nextProps.stage.originRingNodes) {
							const ringNodeInstance = this.originRingNodes[ringNode.id];
							this.getNearbyPointNodes(ringNodeInstance, nextProps.stage.pointNodes);
							this.checkForNoteReschedule(node);
						}
						break;
					case ORIGIN_RING_NODE:
						console.log('ring node moved -- recalculating surround note schedules');
						const ringNodeInstance = this.originRingNodes[node.id];
						this.getNearbyPointNodes(ringNodeInstance, nextProps.stage.pointNodes);
						this.clearScheduledNotesFromSource(this.dragTarget, nextProps.stage.pointNodes);
						for(let pointNode of nextProps.stage.pointNodes) {
							this.checkForNoteReschedule(pointNode);
						}
						break;
					case ORIGIN_RADAR_NODE:
						console.log('radar node moved -- recalculating surround note schedules');
						const radarNodeInstance = this.originRadarNodes[node.id];
						this.getNearbyPointNodes(radarNodeInstance, nextProps.stage.pointNodes);
						this.clearScheduledNotesFromSource(this.dragTarget, nextProps.stage.pointNodes);
						for(let pointNode of nextProps.stage.pointNodes) {
							this.checkForNoteReschedule(pointNode);
						}
						break;
				}
			}
		}
		*/
	}

	render() {
		const { pointer, stagePointer, activeNode } = this.state;
		const { gui, stage, musicality } = this.props;

		const { scale, notes } = musicality;
		const { arcNodes, pointNodes, originRingNodes, originRadarNodes } = stage;

		return (
			<PrimaryInterfaceRenderer width={this.width} height={this.height}>
				<FpsCounter key="fps" />
				
				<PrimaryInterfaceStage 
					key="stage" 
					onMouseMove={this.handlePointerMove} 
					onPointerDown={this.handlePointerDown} 
					onPointerUp={this.handlePointerUp}>

					<PlacementIndicator key="placementIndicator" pointer={stagePointer} />
					<ActiveNodeIndicator key="activeNodeIndicator" activeNode={activeNode} />
				
					{pointNodes.map(node => 
						<PointNode key={node.id} node={node} scale={scale} notes={notes} onPointerDown={this.handleNodePointerDown.bind(this)} onPointerUp={this.handleNodePointerUp.bind(this)} />
					)}

					{originRingNodes.map(node => 
						<OriginRingNode key={node.id} node={node} onPointerDown={this.handleNodePointerDown.bind(this)} onPointerUp={this.handleNodePointerUp.bind(this)} />
					)}

					{originRadarNodes.map(node => 
						<OriginRadarNode key={node.id} node={node} onPointerDown={this.handleNodePointerDown.bind(this)} onPointerUp={this.handleNodePointerUp.bind(this)} />
					)}

				</PrimaryInterfaceStage>
				
			</PrimaryInterfaceRenderer>
		)
	}

}

export default connect(({gui, stage, musicality, synths, transport}) => ({gui, stage, musicality, synths, transport}))(PrimaryInterface)

