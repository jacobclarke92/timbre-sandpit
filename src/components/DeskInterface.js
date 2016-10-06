import React, { Component } from 'react'
import { connect } from 'react-redux'
import _throttle from 'lodash/throttle'
import $ from 'jquery'

import Point from '../Point'
import { addResizeCallback, removeResizeCallback, getScreenWidth, getScreenHeight, getPixelDensity } from '../utils/screenUtils'
import { clamp, inBounds } from '../utils/mathUtils'
import { getByKey } from '../utils/arrayUtils'

import FX from '../constants/fx'
import * as UiViews from '../constants/uiViews'
import * as ActionTypes from '../constants/actionTypes'
import * as DeskItemTypes from '../constants/deskItemTypes'
import { connectWire } from '../reducers/desk'

import DeskInterfaceRenderer from './pixi/DeskInterfaceRenderer'
import InterfaceStage from './pixi/InterfaceStage'
import Container from './pixi/Container'
import DeskItem from './pixi/DeskItem'
import DeskWire from './pixi/DeskWire'

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
			dragTarget: null,
			activeTarget: null,
		};
	}

	componentDidMount() {

		this.$container = $(this.refs.renderer.refs.container);

		// bind scrollwheel to sizing anchor nodes
		$(window).on('mousewheel DOMMouseScroll', this.handleMousewheel);

		// bind window resize
		addResizeCallback(this.handleResize);
		this.handleResize();
	}

	componentWillUnmount() {
		$(window).off('mousewheel DOMMouseScroll', this.handleMousewheel);
		removeResizeCallback(this.handleResize);
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
		const { desk } = this.props;
		const { mouseMoved, dragTarget, wireFrom, wireTo, wireToValid, wireType, ioType } = this.state;
		console.log('mouseup');

		if(mouseMoved && dragTarget) {
			this.props.dispatch({type: ActionTypes.DESK_ITEM_MOVE, id: dragTarget.id, position: dragTarget.position});
		}else if(wireFrom && wireTo && wireToValid) {
			const output = getByKey(desk, ioType == 'output' ? wireFrom.parent.id : wireTo.parent.id);
			const input = getByKey(desk, ioType == 'output' ? wireTo.parent.id : wireFrom.parent.id);
			this.props.dispatch(connectWire(output, input, wireType));
		}

		this.setState({
			mouseDown: false,
			dragTarget: null,
			wireFrom: null,
			wireTo: null,
			wireToValid: false,
			ioType: null,
			wireType: null,
		});
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

	handleItemPointerDown(event, deskItem) {
		event.stopPropagation();
		console.log('pointer down for ', deskItem);
		this.setState({
			mouseMoved: false,
			mouseDown: true,
			dragTarget: event.target,
		});
	}

	handleOverIO(event, deskItem, wireType, ioType) {
		this.setState({overIO: true});
		if(this.state.wireFrom) {
			this.setState({
				wireTo: event.target,
				wireToValid: (this.state.wireType == wireType && this.state.ioType != ioType),
			});
		}
	}

	handleOutIO(event) {
		this.setState({
			overIO: false,
			wireTo: null,
			wireToValid: null,
		})
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

	render() {
		const { width, height, aimScale, pointer, stagePointer, stagePosition, dragTarget, mouseDown, wireFrom, wireTo, wireToValid } = this.state;
		const { fx, synths, desk } = this.props;
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

					{wireFrom && 
						<DeskWire 
							key="active_wire" 
							valid={wireToValid}
							from={{x: wireFrom.parent.position.x + wireFrom.position.x, y: wireFrom.parent.position.y + wireFrom.position.y}} 
							to={(wireTo && wireToValid) ? {x: wireTo.parent.position.x + wireTo.position.x, y: wireTo.parent.position.y + wireTo.position.y} : stagePointer} 
							desk={desk} />
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
								key={i} 
								{...deskItem}
								owner={owner}
								params={params}
								onRename={() => this.handleRename(deskItem)}
								onPointerDown={event => this.handleItemPointerDown(event, deskItem)}
								onPointerUp={event => null/*this.handleItemPointerUp(deskItem)*/}
								onOutIO={event => this.handleOutIO(event)}
								onOverIO={(event, wireType, ioType) => this.handleOverIO(event, deskItem, wireType, ioType)} 
								onPointerDownIO={(event, wireType, ioType) => this.handlePointerDownIO(event, deskItem, wireType, ioType)} />
						)
					})}

				</InterfaceStage>

			</DeskInterfaceRenderer>
		)
	}
}

export default connect(({gui, desk, synths, fx}) => ({gui, desk, synths, fx}))(DeskInterface)