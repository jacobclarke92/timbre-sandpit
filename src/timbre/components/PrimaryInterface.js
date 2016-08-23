import React, { Component } from 'react'
import { connect } from 'react-redux'
import $ from 'jquery'
import PIXI, { Container, Graphics, Sprite } from 'pixi.js'
import _throttle from 'lodash/throttle'

import Point from '../Point'
import { getPixelDensity, addResizeCallback, triggerResize } from '../utils/screenUtils'
import { dist, clamp } from '../utils/mathUtils'
import * as keyUtils from '../utils/keyUtils'
import newId from '../utils/newId'

import noteColors from '../constants/noteColors'
import * as NoteTypes from '../constants/noteTypes'
import * as NodeTypes from '../constants/nodeTypes'
import { createNode, removeNode } from '../reducers/stage'
import { getRandomNote, getAscendingNote, getDescendingNote, playNote } from '../sound'
import { createPointNode, createRingNode, createArcNode, createRadarNode } from '../nodeGenerators'
import { bindNodeEvents } from '../nodeEventHandlers'

const scaleEase = 10;
const mouseMoveThrottle = 1000/50; // 50fps
const scrollwheelThrottle = 1000/50; // 50fps

class PrimaryInterface extends Component {

	static defaultProps = {
		maxZoom: 4,
		minZoom: 0.2,
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
		this.renderer = new PIXI.autoDetectRenderer(this.width, this.height, {resolution: getPixelDensity(), transparent: false, backgroundColor: 0x000000, antialiasing: true});
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

		this.anchorsContainer = new Container();
		this.stage.addChild(this.anchorsContainer);

		this.fxRipples = [];
		this.placing = false;
		this.mouseMoved = false;
		this.mouseDown = false;
		this.stageCursor = new Point(0,0);
		this.lastStageCursor = new Point(0,0);
		this.cursor = new Point(0,0);
		this.lastCursor = new Point(0,0);

		this.initedNodeIds = [];
		this.pointNodes = {};
		this.originRingNodes = {};
		this.arcNodes = {};
		this.originRadarNodes = {};

		this.activeNode = null;


		// bind scrollwheel to sizing anchor nodes
		$(window).on('mousewheel DOMMouseScroll', ::this.handleMousewheel);

		addResizeCallback(::this.handleResize);
		setTimeout(() => triggerResize(), 10);

		this.mounted = true;
		this.animate();

	}

	handleResize() {
		this.width = this.$container.width();
		this.height = this.$container.height();
		this.offsetY = this.$container.offset().top;
		if(this.renderer) this.renderer.resize(this.width, this.height);
		console.log(this.width, this.height);
	}

	handleMousewheel(event) {
		const scrollAmount = event.originalEvent.wheelDelta || event.originalEvent.detail;
		if (scrollAmount !== 0) this.aimScale = clamp(this.aimScale + scrollAmount/200, this.props.minZoom, this.props.maxZoom);
	}

	handlePointerDown(event) {
		this.mouseDown = true;
		this.mouseMoved = false;
	}

	handlePointerUp(event) {
		this.mouseDown = false;
		if(!this.mouseMoved) this.createNode(event);
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
		/*
		if(this.placing) {
			this.mouseMoved = true;
			const mouse = new Point(positionX, positionY);
			const distance = mouse.distance(this.activeAnchor);
			const angle = Math.atan2(mouse.y - this.activeAnchor.y, mouse.x - this.activeAnchor.x);
			if(distance > 20) {
				this.activeAnchor.rotation = angle;
				if(angle > 0 && angle < Math.PI && this.activeAnchor.type != NoteTypes.DOWN) {
					this.changeAnchorType(this.activeAnchor, NoteTypes.DOWN);
				}else if(angle < 0 || angle > Math.PI && this.activeAnchor.type != NoteTypes.UP) {
					this.changeAnchorType(this.activeAnchor, NoteTypes.UP);
				}
			}else if(this.activeAnchor.type != NoteTypes.RANDOM) {
				this.changeAnchorType(this.activeAnchor, NoteTypes.RANDOM);
			}
		}
		*/
	}

	createNode(event) {
		if(!event.target || !event.data) return;
		const spawnPoint = event.data.getLocalPosition(event.target);
		this.props.dispatch(createNode(this.props.gui.tool, {id: newId(), position: {x: spawnPoint.x, y: spawnPoint.y}}));
	}

	removeNode(nodeInstance) {
		this.stage.removeChild(nodeInstance);
		// todo: remove from class arrays
		this.props.dispatch(removeNode(nodeInstance.nodeType, nodeInstance.id));
	}

	createNodeInstance(nodeType, nodeAttrs)  {
		let node = null;
		switch(nodeType) {
			case NodeTypes.POINT_NODE:
				node = createPointNode(nodeAttrs);
				this.stage.addChild(node);
				this.pointNodes[nodeAttrs.id] = node;
				this.initedNodeIds.push(nodeAttrs.id);
				break;

			case NodeTypes.ORIGIN_RING_NODE:
				node = createRingNode(nodeAttrs);
				this.stage.addChild(node);
				this.ringNodes[nodeAttrs.id] = node;
				this.initedNodeIds.push(nodeAttrs.id);
				break;
		}
		if(node) bindNodeEvents.call(this, nodeType, node);
	}

	animate() {

		const { gui, stage, transport } = this.props;
		const { pointNodes, originRingNodes } = stage;

		for(let pointNode of pointNodes) {
			// instanciate a pixi pointNode if it doesn't exist - just created or on load
			if(this.initedNodeIds.indexOf(pointNode.id) < 0) {
				console.log('Creating PIXI pointNode');
				this.createNodeInstance(NodeTypes.POINT_NODE, pointNode)
			}
		}
		
		// pan controls
		if(keyUtils.isUpKeyPressed()) this.stage.position.y += scaleEase;
		else if(keyUtils.isDownKeyPressed()) this.stage.position.y -= scaleEase;
		if(keyUtils.isLeftKeyPressed()) this.stage.position.x += scaleEase;
		else if(keyUtils.isRightKeyPressed()) this.stage.position.x -= scaleEase;
		
		// scale easing
		const stageScale = this.stage.scale.x;
		this.stage.scale.set(stageScale + (this.aimScale - stageScale)/scaleEase);

		// render and animation loop 
		this.renderer.render(this.stage);
		if(transport.playing) requestAnimationFrame(this.animate.bind(this));
	}

	// force animation to start again if props update
	componentWillReceiveProps(nextProps) {
		if(nextProps.transport.playing && !this.props.transport.playing) setTimeout(() => this.animate());
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

export default connect(({gui, stage, musicality, envelope, transport}) => ({gui, stage, musicality, envelope, transport}))(PrimaryInterface)

