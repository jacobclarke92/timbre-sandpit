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
import { getRandomNote, getAscendingNote, getDescendingNote, playNote } from '../sound'

const scaleEase = 10;

class PrimaryInterface extends Component {

	static defaultProps = {
		maxZoom: 4,
		minZoom: 0.2,
	};

	constructor(props) {
		super(props);
		this.handlePointerMove = _throttle(this.handlePointerMove, 50);

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
		this.stage.on('mousedown', event => this.createNode(event));
		this.stage.on('touchstart', event => this.createNode(event));
		this.stage.on('mousemove', event => this.handlePointerMove(event));
		this.stage.on('touchmove', event => this.handlePointerMove(event));
		this.stage.on('mouseup', event => this.handlePointerUp());
		this.stage.on('touchend', event => this.handlePointerUp());

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
		this.stageCursor = new Point(0,0);


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

	createNode(event) {
		if(!event.target || !event.data) return;
		const spawnPoint = event.data.getLocalPosition(event.target);
		const { tool } = this.props.gui;
		console.log('Should create', tool);
	}

	handlePointerMove(event) {
		this.stageCursor = event.data.getLocalPosition(this.stage);
		this.stage.position.x += (this.stageCursor.x - this.stage.pivot.x) * this.stage.scale.x;
		this.stage.position.y += (this.stageCursor.y - this.stage.pivot.y) * this.stage.scale.y;
		this.stage.pivot = this.stageCursor;
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

	handlePointerUp() {
		/*
		if(this.placing) {
			event.stopPropagation();
			console.log('finished placing');
			this.activeAnchor = null;
			this.placing = false;
		}
		*/
	}

	animate() {

		const { gui, stage, transport } = this.props;

		
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

