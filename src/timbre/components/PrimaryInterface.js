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
import FXContainer from './nodes/FXContainer'
import PlacementIndicator from './nodes/PlacementIndicator'
import ActiveNodeIndicator from './nodes/ActiveNodeIndicator'
import PrimaryInterfaceStage from './PrimaryInterfaceStage'
import PrimaryInterfaceRenderer from './PrimaryInterfaceRenderer'

import Point from '../Point'
import newId from '../utils/newId'
import { getValueById } from '../utils/arrayUtils'
import { checkDifferenceAny } from '../utils/lifecycleUtils'
import { getSnapPosition, updateNearbyPointNodes } from '../nodeSpatialUtils'
import { dist, clamp, inBounds, getDistance, getAngle } from '../utils/mathUtils'
import { getPixelDensity, addResizeCallback, triggerResize } from '../utils/screenUtils'
import { isUpKeyPressed, isDownKeyPressed, isLeftKeyPressed, isRightKeyPressed, addKeyListener } from '../utils/keyUtils'
import { cancelLoop, clearScheduledNotes, checkForNoteReschedule, removeScheduledNote, addNoteListener } from '../timing'

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
		this.handleNoteTrigger = this.handleNoteTrigger.bind(this);

		this.state = {
			width: 800,
			height: 450,
			offsetY: 136,
			aimScale: 1/getPixelDensity(),
			pointer: new Point(0,0),
			stagePointer: new Point(0,0),
			stagePosition: new Point(0,0),
			placementPosition: new Point(0,0),
			mouseDownPosition: new Point(0,0),
			mouseDown: false,
			mouseMoved: false,
			dragTarget: null,
			activeTarget: null,
			activeNode: null,
			ringsFX: [],
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

		addNoteListener(this.handleNoteTrigger);

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

		// update mouse position vars
		const pointer = new Point(event.data.originalEvent.clientX, event.data.originalEvent.clientY - this.state.offsetY);
		const stagePointer = event.data.getLocalPosition(event.target);

		// placement snapping
		let placementPosition = stagePointer;
		if(snapping) placementPosition = getSnapPosition(stagePointer);

		this.setState({
			pointer,
			stagePointer,
			placementPosition,
		});
		
		
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
				clearScheduledNotes(dragTarget);
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
				// if a node has been moved then check if notes need to be scheduled
				updateNearbyPointNodes();
				checkForNoteReschedule(this.state.dragTarget);
				this.setState({dragTarget: null});
			}
		}

		this.setState({
			mouseMoved: false,
			mouseDown: false,
		});
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
	handleNodeMove(nodeInstance = this.state.dragTarget) {
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

	// plays a note!
	handleNoteTrigger(originNode, node, eventId) {
		const { musicality, stage } = this.props;
		const noteIndex = playNote(node, originNode.synthId);
		const color = noteColors[(noteIndex + musicality.scale)%12];

		const ring = {
			id: newId(),
			color,
			position: node.position,
			speed: originNode.speed,
		};
		this.setState({ringsFX: [...this.state.ringsFX, ring]});

		removeScheduledNote(originNode.id, node.id, eventId);
	}

	handleRemoveRingFX(ringFX) {
		this.setState({ringsFX: this.state.ringsFX.filter(ring => ring != ringFX)});
	}

	render() {
		const { width, height, aimScale, pointer, stagePointer, placementPosition, activeNode, stagePosition, dragTarget, mouseDown, ringsFX } = this.state;
		const { gui, stage, musicality, transport } = this.props;

		const { scale, notes, modeString } = musicality;
		const { arcNodes, pointNodes, originRingNodes, originRadarNodes } = stage;

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


					<PlacementIndicator key="placementIndicator" pointer={placementPosition} />
					<ActiveNodeIndicator key="activeNodeIndicator" activeNode={activeNode} />
					<FXContainer key="FXContainer">
						{ringsFX.map(ring => 
							<RingFX 
								key={ring.id} 
								bpm={transport.bpm} 
								onRemoveRingFX={() => this.handleRemoveRingFX(ring)} 
								{...ring} />
						)}
					</FXContainer>
				
					{pointNodes.map(node => 
						<PointNode 
							key={node.id} 
							node={node} 
							scale={scale} 
							notes={notes} 
							modeString={modeString}
							onPointerDown={this.handleNodePointerDown} 
							onPointerUp={this.handleNodePointerUp} />
					)}

					{originRingNodes.map(node => 
						<OriginRingNode
							key={node.id}
							node={node}
							showGuides={gui.showGuides}
							onPointerDown={this.handleNodePointerDown}
							onPointerUp={this.handleNodePointerUp} />
					)}

					{originRadarNodes.map(node => 
						<OriginRadarNode
							key={node.id}
							node={node}
							showGuides={gui.showGuides}
							onPointerDown={this.handleNodePointerDown}
							onPointerUp={this.handleNodePointerUp} />
					)}

				</PrimaryInterfaceStage>
				
			</PrimaryInterfaceRenderer>
		)
	}

}

export default connect(({gui, stage, musicality, synths, transport}) => ({gui, stage, musicality, synths, transport}))(PrimaryInterface)

