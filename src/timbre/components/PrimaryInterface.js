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

import RingFX from './nodes/RingFX'
import FpsCounter from './nodes/FpsCounter'
import PlacementIndicator from './nodes/PlacementIndicator'
import ActiveNodeIndicator from './nodes/ActiveNodeIndicator'
import PrimaryInterfaceStage from './PrimaryInterfaceStage'
import PrimaryInterfaceRenderer from './PrimaryInterfaceRenderer'

import Point from '../Point'
import newId from '../utils/newId'
import { getValueById } from '../utils/arrayUtils'
import { checkDifferenceAny } from '../utils/lifecycleUtils'
import { cancelLoop, clearScheduledNotes } from '../timing'
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
		this.handleMousewheel = _throttle(this.handleMousewheel.bind(this), scrollwheelThrottle);
		this.handleNodeMove = _debounce(this.handleNodeMove, 50);
		this.handlePointerUp = this.handlePointerUp.bind(this);
		this.handlePointerDown = this.handlePointerDown.bind(this);
		this.handleNodePointerUp = this.handleNodePointerUp.bind(this);
		this.handleNodePointerDown = this.handleNodePointerDown.bind(this);

		this.state = {
			width: 800,
			height: 450,
			offsetY: 136,
			aimScale: 1/getPixelDensity(),
			pointer: new Point(0,0),
			stagePointer: new Point(0,0),
			stagePosition: new Point(0,0),
			mouseDown: false,
			mouseMoved: false,
			mouseDownPosition: new Point(0,0),
			dragTarget: null,
			activeTarget: null,
			activeNode: null,
		}
	}

	componentDidMount() {

		this.$container = $(this.refs.renderer.refs.container);

		/*

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

		// transport callback
		this.loop = new Loop(::this.tick, this.props.transport.meterTime+'n');
		this.beat = -1;

		*/
	
		// bind scrollwheel to sizing anchor nodes
		$(window).on('mousewheel DOMMouseScroll', this.handleMousewheel);
	
		addResizeCallback(::this.handleResize);
		addKeyListener('backspace', ::this.removeActiveNode);
		addKeyListener('delete', ::this.removeActiveNode);
		addKeyListener('esc', ::this.clearActiveNode);
		setTimeout(() => triggerResize(), 10);

	}

	handleResize() {
		this.setState({
			width: this.$container.width(),
			height: this.$container.height(),
			offsetY: this.$container.offset().top,
		});
	}

	handleMousewheel(event) {
		const { mouseDown, pointer, width, height } = this.state;
		// disable scroll zoom while dragging / clicking
		if(!mouseDown && inBounds(pointer, 0, 0, width, height)) {
			const scrollAmount = event.originalEvent.wheelDelta || event.originalEvent.detail;
			if (scrollAmount !== 0) {
				const aimScale = clamp(this.state.aimScale + scrollAmount/200, this.props.minZoom, this.props.maxZoom);
				this.setState({aimScale});
			}
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
		const pointer = new Point(event.data.originalEvent.clientX, event.data.originalEvent.clientY - this.state.offsetY);
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
			}
		}
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
		const spawnPoint = this.props.gui.snapping ? this.state.placementPosition : event.data.getLocalPosition(event.target);
		console.log('creating node', event, spawnPoint);
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
		console.log('removing node', nodeInstance);
		if(!nodeInstance) return;
		cancelLoop(nodeInstance.id);
		clearScheduledNotes(nodeInstance);
		this.props.dispatch(removeNode(nodeInstance.nodeType, nodeInstance.id));
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
		console.log('clearing active node');
		if(this.props.gui.activeNode) {
			this.props.dispatch({type: ActionTypes.CLEAR_ACTIVE_NODE})
			this.setState({activeNode: null});
		}
	}
	
	// for actually deleting the active node
	removeActiveNode() {
		if(!this.props.gui.activeNode) return;
		this.removeNode(this.state.activeNode);
		this.clearActiveNode();
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

	/*
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
	*/

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


	/*
	// called on node delete of any kind
	clearScheduledNotes(nodeInstance) {
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
	*/

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
		const { width, height, aimScale, pointer, stagePointer, activeNode, stagePosition, dragTarget, mouseDown} = this.state;
		const { gui, stage, musicality, transport } = this.props;

		const { scale, notes } = musicality;
		const { arcNodes, pointNodes, originRingNodes, originRadarNodes, nearbyPointNodes } = stage;

		return (
			<PrimaryInterfaceRenderer ref="renderer" width={width} height={height} playing={transport.playing}>
				
				<FpsCounter key="fps" />
				
				<PrimaryInterfaceStage 
					key="stage" 
					aimScale={aimScale}
					pointer={pointer}
					stagePointer={stagePointer}
					position={stagePosition}
					panning={!dragTarget && mouseDown}
					onMouseMove={this.handlePointerMove} 
					onPointerDown={this.handlePointerDown} 
					onPointerUp={this.handlePointerUp}>


					<PlacementIndicator key="placementIndicator" pointer={stagePointer} />
					<ActiveNodeIndicator key="activeNodeIndicator" activeNode={activeNode} />
					<RingFX key="ringFX" bpm={transport.bpm} />
				
					{pointNodes.map(node => 
						<PointNode 
							key={node.id} 
							node={node} 
							scale={scale} 
							notes={notes} 
							onPointerDown={this.handleNodePointerDown} 
							onPointerUp={this.handleNodePointerUp} />
					)}

					{originRingNodes.map(node => 
						<OriginRingNode
							key={node.id}
							node={node}
							showGuides={gui.showGuides}
							nearbyPointNodes={nearbyPointNodes[node.id] || []}
							onPointerDown={this.handleNodePointerDown}
							onPointerUp={this.handleNodePointerUp} />
					)}

					{originRadarNodes.map(node => 
						<OriginRadarNode
							key={node.id}
							node={node}
							showGuides={gui.showGuides}
							nearbyPointNodes={nearbyPointNodes[node.id] || []}
							onPointerDown={this.handleNodePointerDown}
							onPointerUp={this.handleNodePointerUp} />
					)}

				</PrimaryInterfaceStage>
				
			</PrimaryInterfaceRenderer>
		)
	}

}

export default connect(({gui, stage, musicality, synths, transport}) => ({gui, stage, musicality, synths, transport}))(PrimaryInterface)

