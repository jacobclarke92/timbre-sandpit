import React, { Component } from 'react'
import { connect } from 'react-redux'
import PIXI, { Container, Graphics, Sprite, Text } from 'pixi.js'
import Tone, { Loop, Transport } from 'tone'
import _throttle from 'lodash/throttle'
import _debounce from 'lodash/debounce'
import _get from 'lodash/get'
import $ from 'jquery'

import ArcNode from './pixi/ArcNode'
import PointNode from './pixi/PointNode'
import OriginRingNode from './pixi/OriginRingNode'
import OriginRadarNode from './pixi/OriginRadarNode'

import RingFX from './pixi/RingFX'
import FpsCounter from './pixi/FpsCounter'
import FXContainer from './pixi/FXContainer'
import PlacementIndicator from './pixi/PlacementIndicator'
import ActiveNodeIndicator from './pixi/ActiveNodeIndicator'
import PrimaryInterfaceStage from './PrimaryInterfaceStage'
import PrimaryInterfaceRenderer from './PrimaryInterfaceRenderer'

import Point from '../Point'
import newId from '../utils/newId'
import { getValueById } from '../utils/arrayUtils'
import { checkDifferenceAny } from '../utils/lifecycleUtils'
import { getSnapPosition, updateNearbyPointNodes } from '../spatial'
import { dist, clamp, inBounds, getDistance, getAngle } from '../utils/mathUtils'
import { getPixelDensity, addResizeCallback, triggerResize } from '../utils/screenUtils'
import { cancelLoop, clearScheduledNotes, checkForNoteReschedule, addNoteListener } from '../timing'
import { isUpKeyPressed, isDownKeyPressed, isLeftKeyPressed, isRightKeyPressed, addKeyListener } from '../utils/keyUtils'

import noteColors from '../constants/noteColors'
import * as UiViews from '../constants/uiViews'
import * as NoteTypes from '../constants/noteTypes'
import * as ActionTypes from '../constants/actionTypes'
import { BEAT_PX, METER_TICKS } from '../constants/globals'
import { createNode, removeNode, updateNode } from '../reducers/stage'
import { getRandomNote, getAscendingNote, getDescendingNote, playNote } from '../sound'
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
	
		// bind scrollwheel to sizing anchor nodes
		$(window).on('mousewheel DOMMouseScroll', this.handleMousewheel);
		
		// bind window resize
		addResizeCallback(::this.handleResize);
		setTimeout(() => triggerResize(), 10);

		// bind note trigger
		addNoteListener(this.handleNoteTrigger);

		// bind key listeners
		addKeyListener('backspace', ::this.removeActiveNode);
		addKeyListener('delete', ::this.removeActiveNode);
		addKeyListener('esc', ::this.clearActiveNode);

	}

	handleResize() {
		this.setState({
			width: this.$container.width(),
			height: this.$container.height(),
			offsetY: this.$container.offset().top,
		});
	}

	handleMousewheel(event) {
		if(this.props.gui.view != UiViews.PRIMARY) return;
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
		const { musicality, stage, transport } = this.props;

		const noteIndex = playNote(node, originNode.synthId);
		if(!transport.windowVisible) return;

		const color = noteColors[(noteIndex + musicality.scale)%12];
		const ring = {
			id: newId(),
			color,
			position: node.position,
			speed: originNode.speed,
		};
		this.setState({ringsFX: [...this.state.ringsFX, ring]});
	}

	handleRemoveRingFX(ringFX) {
		this.setState({ringsFX: this.state.ringsFX.filter(ring => ring != ringFX)});
	}

	render() {
		const { width, height, aimScale, pointer, stagePointer, placementPosition, activeNode, stagePosition, dragTarget, mouseDown, ringsFX } = this.state;
		const { gui, stage, musicality, transport } = this.props;

		const { bpm, playing, meterTime } = transport;
		const { scale, notes, modeString } = musicality;
		const { arcNodes, pointNodes, originRingNodes, originRadarNodes } = stage;

		return (
			<PrimaryInterfaceRenderer 
				ref="renderer" 
				width={width} 
				height={height} 
				playing={playing} 
				meterTime={meterTime}>
				
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

					<FXContainer key="FXContainer">
						{ringsFX.map(ring => 
							<RingFX key={ring.id} bpm={bpm} onRemoveRingFX={() => this.handleRemoveRingFX(ring)} {...ring} />
						)}
					</FXContainer>

					<PlacementIndicator key="placementIndicator" pointer={placementPosition} />
					<ActiveNodeIndicator key="activeNodeIndicator" activeNode={activeNode} />
				
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

