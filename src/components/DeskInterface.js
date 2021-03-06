import React, { Component } from 'react'
import { connect } from 'react-redux'
import _throttle from 'lodash/throttle'
import $ from 'jquery'

import Point from '../Point'
import { addResizeCallback, removeResizeCallback, getScreenWidth, getScreenHeight, getPixelDensity } from '../utils/screenUtils'
import { addKeyListener, removeKeyListener } from '../utils/keyUtils'
import { clamp, inBounds } from '../utils/mathUtils'
import { getDeskWires } from '../utils/deskUtils'
import { getByKey } from '../utils/arrayUtils'
import newId from '../utils/newId'

import FX from '../constants/fx'
import * as UiViews from '../constants/uiViews'
import * as ToolTypes from '../constants/toolTypes'
import * as ActionTypes from '../constants/actionTypes'
import * as DeskItemTypes from '../constants/deskItemTypes'
import { connectWire } from '../reducers/desk'

import DeskInterfaceRenderer from './pixi/DeskInterfaceRenderer'
import InterfaceStage from './pixi/InterfaceStage'
import Container from './pixi/Container'
import DeskItem from './pixi/DeskItem'
import DeskWire from './pixi/DeskWire'
import DeskItemOutline from './pixi/DeskItemOutline'

const mouseMoveThrottle = 1000/50; // 50fps
const scrollwheelThrottle = 1000/50; // 50fps

class DeskInterface extends Component {

	static defaultProps = {
		maxZoom: 2,
		minZoom: 0.2,
	};

	constructor(props) {
		super(props);
		this.handleResize = this.handleResize.bind(this);
		this.handlePointerMove = _throttle(this.handlePointerMove.bind(this), mouseMoveThrottle);
		this.handleMousewheel = _throttle(this.handleMousewheel.bind(this), scrollwheelThrottle);
		this.handlePointerUp = this.handlePointerUp.bind(this);
		this.handlePointerDown = this.handlePointerDown.bind(this);
		this.removeActiveItem = this.removeActiveItem.bind(this);
		this.clearActiveItem = this.clearActiveItem.bind(this);
		this.state = {
			width: 800,
			height: 450,
			offsetY: 136,
			aimScale: 0.5,
			pointer: new Point(0,0),
			stagePointer: new Point(0,0),
			stagePosition: new Point(0,0),
			placementPosition: new Point(0,0),
			mouseDownPosition: new Point(0,0),
			mouseDown: false,
			mouseMoved: false,
			overIO: false,
			wireFrom: null,
			wireTo: null,
			wireToValid: false,
			ioType: null,
			wireType: null,
			selectedWire: null,
			selectedDeskItem: null,
			dragTarget: null,
		};
	}

	componentDidMount() {

		this.$container = $(this.refs.renderer.refs.container);

		// bind scrollwheel to sizing anchor nodes
		$(window).on('mousewheel DOMMouseScroll', this.handleMousewheel);

		// bind window resize
		addResizeCallback(this.handleResize);
		this.handleResize();

		// bind key listeners
		addKeyListener('backspace', this.removeActiveItem);
		addKeyListener('delete', this.removeActiveItem);
		addKeyListener('esc', this.clearActiveItem);
	}

	componentWillUnmount() {
		$(window).off('mousewheel DOMMouseScroll', this.handleMousewheel);
		removeResizeCallback(this.handleResize);
		removeKeyListener('backspace', this.removeActiveItem);
		removeKeyListener('delete', this.removeActiveItem);
		removeKeyListener('esc', this.clearActiveItem);
	}

	handleResize() {
		this.setState({
			width: this.$container.width(),
			height: this.$container.height(),
			offsetY: this.$container.offset().top,
		});
	}

	handleMousewheel(event) {
		if(this.props.gui.view != UiViews.DESK) return;
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

	handlePointerMove(event) {
		if(this.props.gui.view != UiViews.DESK) return;
		const { snapping } = this.props.gui;

		// update mouse position vars
		const pointer = new Point(event.data.originalEvent.clientX, event.data.originalEvent.clientY - this.state.offsetY);
		const stagePointer = event.data.getLocalPosition(event.target);

		// placement snapping
		let placementPosition = stagePointer;
		// if(snapping) placementPosition = getSnapPosition(stagePointer);

		this.setState({
			pointer,
			stagePointer,
			placementPosition,
		});
		
		
		const { mouseDown, mouseMoved, mouseDownPosition, dragTarget, overIO } = this.state;
		// enforce a minimum distance before allowing panning
		if(mouseDown && !mouseMoved && pointer.distance(mouseDownPosition) < 10) return true;

		this.setState({
			mouseMoved: true,
		});

		if(mouseDown) {
			if(dragTarget) {
				if(overIO) {
					console.log('mousemove IO');
				}else{
					// reposition node if dragging
					dragTarget.position.x = (snapping ? placementPosition.x : stagePointer.x) - 100;
					dragTarget.position.y = (snapping ? placementPosition.y : stagePointer.y) - 100;
					// this.handleNodeMove();
				}
			}
		}
	}

	handlePointerDown(event) {
		if(this.props.gui.view != UiViews.DESK) return;
		console.log('mousedown');
		this.setState({
			mouseDown: true,
			mouseMoved: false,
			dragTarget: null,
			mouseDownPosition: new Point(event.data.originalEvent.clientX, event.data.originalEvent.clientY - this.state.offsetY),
		});
	}

	handlePointerUp(event) {
		if(this.props.gui.view != UiViews.DESK) return;
		const { gui, desk } = this.props;
		const { mouseMoved, dragTarget, wireFrom, wireTo, wireToValid, wireType, ioType, stagePointer, selectedDeskItem } = this.state;
		console.log('mouseup');

		if(mouseMoved && dragTarget) {
			this.props.dispatch({type: ActionTypes.DESK_ITEM_MOVE, id: dragTarget.id, position: dragTarget.position});
		}else if(wireFrom && wireTo && wireToValid) {
			const outputNode = ioType == 'output' ? wireFrom : wireTo;
			const inputNode = ioType == 'output' ? wireTo : wireFrom;
			const output = getByKey(desk, outputNode.parent.id);
			const input = getByKey(desk, inputNode.parent.id);
			this.props.dispatch(connectWire(wireType, output, input, outputNode, inputNode));
		}else if(!mouseMoved && gui.tool == ToolTypes.DESK_FX_EDIT && gui.toolSettings.fxType) {
			this.props.dispatch({
				id: gui.toolSettings.fxType+'_'+newId(),
				type: ActionTypes.ADD_FX, 
				fxType: gui.toolSettings.fxType, 
				position: {x: stagePointer.x - 100, y: stagePointer.y - 100},
			});
		}

		this.setState({
			mouseDown: false,
			dragTarget: null,
			wireFrom: null,
			wireTo: null,
			wireToValid: false,
			ioType: null,
			wireType: null,
			selectedWire: null,
			selectedDeskItem: null,
		});
	}

	handleItemPointerDown(event, deskItem) {
		event.stopPropagation();
		console.log('pointer down for ', deskItem);
		this.setState({
			mouseMoved: false,
			mouseDown: true,
			dragTarget: event.target,
		});
	}

	handleItemPointerUp(event, deskItem) {
		if(!this.state.mouseMoved) {
			event.stopPropagation();
			this.setState({
				selectedDeskItem: deskItem,
				mouseDown: false,
				dragTarget: null,
				selectedWire: null,
			});
		}
	}

	handleOverIO(event, deskItem, wireType, ioType, label) {
		this.setState({overIO: true});
		if(this.state.wireFrom) {
			this.setState({
				wireTo: event.target,
				wireToValid: (this.state.wireType == wireType && this.state.ioType != ioType),
			});
		}
		this.props.dispatch({type: ActionTypes.UPDATE_TOOLTIP, text: label});
	}

	handleOutIO(event) {
		this.setState({
			overIO: false,
			wireTo: null,
			wireToValid: null,
		});
		this.props.dispatch({type: ActionTypes.REMOVE_TOOLTIP});
	}

	handlePointerDownIO(event, deskItem, wireType, ioType) {
		event.stopPropagation();
		this.setState({
			mouseMoved: false,
			mouseDown: true,
			wireFrom: event.target,
			wireType,
			ioType,
		});
	}

	handleRename(deskItem) {
		const name = prompt('Enter new name for "'+deskItem.name+'"');
		if(name) this.props.dispatch({type: ActionTypes.DESK_ITEM_RENAME, id: deskItem.id, name});
	}

	clearActiveItem() {
		this.setState({
			selectedWire: null,
			wireFrom: null,
			wireTo: null,
			wireToValid: null,
		});
	}

	removeActiveItem() {
		const { selectedWire, selectedDeskItem } = this.state;
		if(selectedWire) {
			console.log('Will delete wire', selectedWire);
			const { outputOwnerId, inputOwnerId, inputParamKey } = selectedWire;
			this.props.dispatch({
				type: ActionTypes.DESK_DISCONNECT_WIRE, 
				wireType: selectedWire.type,
				outputOwnerId,
				inputOwnerId,
				inputParamKey,
			});
		}else if(selectedDeskItem) {
			let type = null;
			if(selectedDeskItem.type == DeskItemTypes.FX) type = ActionTypes.REMOVE_FX;
			if(selectedDeskItem.type == DeskItemTypes.SYNTH) type = ActionTypes.REMOVE_SYNTH;
			if(selectedDeskItem.type == DeskItemTypes.LFO) type = ActionTypes.REMOVE_LFO;
			this.props.dispatch({type, id: selectedDeskItem.ownerId});
		}
	}

	render() {
		const { width, height, aimScale, pointer, stagePointer, stagePosition, dragTarget, mouseDown, wireFrom, wireTo, wireToValid, selectedWire, selectedDeskItem } = this.state;
		const { gui, fx, synths, desk } = this.props;

		const connections = getDeskWires(desk); // todo only update on desk updates

		return (
			<DeskInterfaceRenderer 
				ref="renderer" 
				backgroundColor={0x222222}
				width={width} 
				height={height}>

				<InterfaceStage 
					key="stage" 
					aimScale={aimScale}
					pointer={pointer}
					stagePointer={stagePointer}
					position={stagePosition}
					panning={!dragTarget && !wireFrom && mouseDown}
					onMouseMove={this.handlePointerMove} 
					onPointerDown={this.handlePointerDown} 
					onPointerUp={this.handlePointerUp}>

					{connections.map((wire, i) => 
						<DeskWire
							key={wire.id}
							zIndex={1+i}
							from={wire.from}
							to={wire.to}
							selected={selectedWire && selectedWire.id == wire.id}
							onSelect={event => this.setState({selectedWire: wire, selectedDeskItem: null})} />
					)}

					{wireFrom && 
						<DeskWire 
							key="active_wire"
							zIndex={10000}
							isLive={true}
							valid={wireToValid}
							from={{x: wireFrom.parent.position.x + wireFrom.position.x, y: wireFrom.parent.position.y + wireFrom.position.y}} 
							to={(wireTo && wireToValid) ? {x: wireTo.parent.position.x + wireTo.position.x, y: wireTo.parent.position.y + wireTo.position.y} : stagePointer} 
							/>
					}

					{gui.tool == ToolTypes.DESK_FX_EDIT && 
						<DeskItemOutline key="fx_outline" zIndex={2000} position={stagePointer} lineWidth={aimScale} />
					}

					{desk.map((deskItem, i) => {
						let params = [];
						let owner = null;
						if(deskItem.type == DeskItemTypes.FX) {
							owner = getByKey(fx, deskItem.ownerId);
							params = FX[owner.type].params || [];
						}
						return (
							<DeskItem 
								key={deskItem.id}
								zIndex={2000+i}
								{...deskItem}
								owner={owner}
								params={params}
								selected={!!(selectedDeskItem && selectedDeskItem.id === deskItem.id)}
								onRename={() => this.handleRename(deskItem)}
								onPointerDown={event => this.handleItemPointerDown(event, deskItem)}
								onPointerUp={event => this.handleItemPointerUp(event, deskItem)}
								onOutIO={event => this.handleOutIO(event)}
								onOverIO={(event, wireType, ioType, label) => this.handleOverIO(event, deskItem, wireType, ioType, label)} 
								onPointerDownIO={(event, wireType, ioType) => this.handlePointerDownIO(event, deskItem, wireType, ioType)} />
						)
					})}

				</InterfaceStage>

			</DeskInterfaceRenderer>
		)
	}
}

export default connect(({gui, desk, synths, fx}) => ({gui, desk, synths, fx}))(DeskInterface)