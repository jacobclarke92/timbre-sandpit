import React, { Component } from 'react'
import { connect } from 'react-redux'
import $ from 'jquery'
import PIXI, { Container, Graphics, Sprite } from 'pixi.js'
import Point from '../Point'
import { getPixelDensity, addResizeCallback, triggerResize } from '../utils/screenUtils'
import { dist } from '../utils/mathUtils'
import newId from '../utils/newId'

import noteColors from '../constants/noteColors'
import * as AnchorTypes from '../constants/anchorTypes'
import { getRandomNote, getAscendingNote, getDescendingNote, playNote } from '../sound'

const offsetY = 100;

class PrimaryInterface extends Component {

	static defaultProps = {
		reactive: false,
		showGuides: true,
		globalSpeed: 2.5,
		guideDivisions: 8,
		guideSubdivisions: 4,
		radialDivisions: 4,
		radialSubdivisions: 3,
	};

	componentDidMount() {
		this.$container = $(this.refs.container);
		this.handleResize();
		
		this.renderer = new PIXI.autoDetectRenderer(this.width, this.height, {resolution: getPixelDensity(), transparent: false, backgroundColor: 0x000000, antialiasing: true});
		this.canvas = this.renderer.view;
		this.$container.append(this.canvas);

		this.stage = new Container();
		this.stage.scale.set(1/getPixelDensity());
		this.stage.interactive = true;

		this.guidesGraphic = new Graphics();
		this.stage.addChild(this.guidesGraphic);

		this.ripplesGraphic = new Graphics();
		this.stage.addChild(this.ripplesGraphic);

		this.clickZone = new Sprite();
		this.clickZone.interactive = true;
		this.clickZone.hitArea = new PIXI.Rectangle(0,0,10000,10000);
		this.clickZone.on('mousedown', event => this.createAnchorNode(event.data.originalEvent.clientX, event.data.originalEvent.clientY - offsetY));
		this.clickZone.on('touchstart', event => this.createAnchorNode(event.data.originalEvent.touches[0].clientX, event.data.originalEvent.touches[0].clientY - offsetY));
		this.clickZone.on('mousemove', event => this.handlePointerMove(event.data.originalEvent.clientX, event.data.originalEvent.clientY - offsetY));
		this.clickZone.on('touchmove', event => this.handlePointerMove(event.data.originalEvent.touches[0].clientX, event.data.originalEvent.touches[0].clientY - offsetY));
		this.clickZone.on('mouseup', event => this.handlePointerUp());
		this.clickZone.on('touchend', event => this.handlePointerUp());
		this.stage.addChild(this.clickZone);

		this.anchorsContainer = new Container();
		this.stage.addChild(this.anchorsContainer);

		this.ripples = [];
		this.fxRipples = [];
		this.anchors = [];
		this.activeAnchor = null;
		this.placing = false;
		this.mouseMoved = false;
		this.drawnGuides = false;
		this.lastScale = 1;

		this.showGuides = true;

		// init central ripple
		this.ripples.push({
			id: newId(),
			x: 0.5,
			y: 0.5,
			radius: 0,
			speed: this.props.globalSpeed,
			count: 0,
		});



		// bind scrollwheel to sizing anchor nodes
		$(window).on('mousewheel DOMMouseScroll', this.handleMousewheel);

		addResizeCallback(::this.handleResize);
		setTimeout(() => triggerResize(), 10);

		this.mounted = true;
		this.animate();

	}

	handleResize() {
		this.width = this.$container.width();
		this.height = this.$container.height();
		this.maxRadius = Math.sqrt(this.width*this.width + this.height*this.height)/2;
		this.drawnGuides = false;
		if(this.renderer) this.renderer.resize(this.width, this.height);
		console.log(this.width, this.height);
	}

	handleMousewheel(event) {
		if(this.activeAnchor) {
			const scrollAmount = event.originalEvent.wheelDelta || event.originalEvent.detail;
			if (scrollAmount !== 0) {
				let nextScale = this.activeAnchor.scale.x - scrollAmount/50;
				nextScale = Math.min(5, Math.max(1, nextScale));
				this.lastScale = nextScale;
				this.activeAnchor.scale.set(nextScale);
			}
		}
	}

	createAnchorNode(positionX, positionY) {
		const anchor = new Container();
		const graphic = new Graphics();

		anchor.id = newId();
		anchor.interactive = true;
		anchor.buttonMode = true;
		anchor.type = AnchorTypes.RANDOM;
		anchor.radius = 4;
		anchor.counters = {};
		anchor.scale.set(this.lastScale);
		anchor.position.set(positionX, positionY);

		graphic.beginFill(0xFFFFFF);
		graphic.drawCircle(0, 0, anchor.radius);
		anchor.graphic = graphic;
		anchor.addChild(graphic);
		
		anchor.on('mouseover', () => this.activeAnchor = anchor);
		anchor.on('mouseout', () => {
			if(!this.placing) this.activeAnchor = null;
		});
		anchor.on('mousedown', () => {
			this.activeAnchor = anchor;
			this.placing = true;
			this.mouseMoved = false;
		})
		anchor.on('mouseup', function(event) {
			if(this.placing && !this.mouseMoved) {
				event.stopPropagation();
				this.anchorsContainer.removeChild(anchor);
				this.anchors.splice(this.anchors.indexOf(anchor), 1);
			}
			this.placing = false;
			this.mouseMoved = false;
		});

		this.anchorsContainer.addChild(anchor);
		this.anchors.push(anchor);
		this.placing = true;
		this.mouseMoved = true;
		this.activeAnchor = anchor;
	}

	handlePointerMove(positionX, positionY) {
		if(this.placing) {
			this.mouseMoved = true;
			const mouse = new Point(positionX, positionY);
			const distance = mouse.distance(this.activeAnchor);
			const angle = Math.atan2(mouse.y - this.activeAnchor.y, mouse.x - this.activeAnchor.x);
			if(distance > 20) {
				this.activeAnchor.rotation = angle;
				if(angle > 0 && angle < Math.PI && this.activeAnchor.type != AnchorTypes.DOWN) {
					this.changeAnchorType(this.activeAnchor, AnchorTypes.DOWN);
				}else if(angle < 0 || angle > Math.PI && this.activeAnchor.type != AnchorTypes.UP) {
					this.changeAnchorType(this.activeAnchor, AnchorTypes.UP);
				}
			}else if(this.activeAnchor.type != AnchorTypes.RANDOM) {
				this.changeAnchorType(this.activeAnchor, AnchorTypes.RANDOM);
			}
		}
	}

	handlePointerUp() {
		if(this.placing) {
			event.stopPropagation();
			console.log('finished placing');
			this.activeAnchor = null;
			this.placing = false;
		}
	}

	changeAnchorType(anchor, type) {
		if(anchor.type == type) return;
		anchor.type = type;
		anchor.graphic.clear();
		let anchorColor = null;
		switch(type) {
			case AnchorTypes.UP: anchorColor = 0x5D8FFF; break;
			case AnchorTypes.DOWN: anchorColor = 0xFF489E; break;
			default: anchorColor = 0xFFFFFF;
		}
		anchor.graphic.beginFill(anchorColor);
		anchor.graphic.drawCircle(0, 0, anchor.radius);
		if(type == AnchorTypes.UP || type == AnchorTypes.DOWN) {
			anchor.graphic.drawPolygon([
				0,-anchor.radius, 
				0, anchor.radius,
				anchor.radius*3, 0,
			])
		}
	}

	animate() {

		const { reactive, showGuides, globalSpeed, guideDivisions, guideSubdivisions, radialDivisions,radialSubdivisions } = this.props;

		if(showGuides && !this.drawnGuides) {
			let totalDivisions = guideDivisions*guideSubdivisions;
			let radialSegment = this.maxRadius/totalDivisions;
			this.guidesGraphic.clear();
			for(let i=0; i<totalDivisions; i++) {
				this.guidesGraphic.lineStyle(2, (i%guideSubdivisions === 0) ? 0x222222 : 0x111111);
				this.guidesGraphic.drawCircle(this.width/2, this.height/2, i*radialSegment);
			}
			totalDivisions = radialDivisions*radialSubdivisions;
			radialSegment = Math.PI*2/totalDivisions;
			for(let i=0; i<totalDivisions; i++) {
				this.guidesGraphic.lineStyle(3, 0x111111);
				this.guidesGraphic.moveTo(this.width/2, this.height/2);
				this.guidesGraphic.lineTo(
					this.width/2 + Math.cos(i*radialSegment)*this.maxRadius,
					this.height/2 + Math.sin(i*radialSegment)*this.maxRadius
				);
			}
			this.drawnGuides = true;
		}

		// draw main ripples
		this.ripplesGraphic.clear();
		this.ripplesGraphic.lineStyle(3, 0xFFFFFF);
		for(let ripple of this.ripples) {

			// update ripple radius or reset and increment counter if reached the edge
			ripple.radius += ripple.speed;
			if(ripple.radius > this.maxRadius) {
				ripple.radius = 0;
				ripple.count ++;
			}else if(ripple.radius <= 0) {
				ripple.radius = this.maxRadius;
				ripple.count ++;
			}

			// draw ripple
			this.ripplesGraphic.drawCircle(this.width*ripple.x, this.height*ripple.y, ripple.radius);

			// check all anchors to see if ripple has passed over one
			for(let anchor of this.anchors) {
				if(anchor.counters[ripple.id] != ripple.count
				 && ripple.radius >= dist(new Point(this.width*ripple.x, this.height*ripple.y), anchor)) {

				 	// increment anchor counter for ripple so it knows not to trigger next frame
					anchor.counters[ripple.id] = ripple.count;

					// play note
					const note = playNote(
						1*anchor.scale.x, 
						(anchor.x-this.width/2)/(this.width/2), 
						anchor.type
					);

					// create an fx ripple
					this.fxRipples.push({
						id: newId(),
						x: anchor.x,
						y: anchor.y,
						radius: 0,
						speed: globalSpeed/5,
						alpha: 1,
						count: 0,
						parent: anchor.id,
						color: noteColors[note % noteColors.length],
					});

				}
			}
		}

		// draw fx ripples
		for(let ripple of this.fxRipples) {

			// init fx ripple draw
			this.ripplesGraphic.lineStyle(4, ripple.color || 0xff8200, ripple.alpha);
			ripple.radius += globalSpeed;
			ripple.alpha -= 0.01;

			// remove ripple if invisible
			if(ripple.alpha <= 0) this.fxRipples.splice(this.fxRipples.indexOf(ripple), 1);

			//draw fx ripple
			this.ripplesGraphic.drawCircle(ripple.x, ripple.y, ripple.radius);

			// if reactive option is checked do the same anchor check as above ripple loop
			if(reactive) {
				for(let anchor of this.anchors) {
					if(ripple.parent !== anchor.id
					 && !anchor.counters[ripple.id]
					 && ripple.radius >= dist(ripple, anchor)) {
						
						anchor.counters[ripple.id] = ripple.id;

						const note = playNote(
							ripple.alpha*anchor.scale.x, 
							(anchor.x-this.width/2)/(this.width/2),
							anchor.type
						);

						this.fxRipples.push({
							id: newId(),
							x: anchor.x,
							y: anchor.y,
							radius: 0,
							speed: 1,
							count: 0,
							alpha: ripple.alpha/1.5,
							parent: anchor.id,
							color: noteColors[note % noteColors.length],
						});

					}
				}
			}
		}


		this.renderer.render(this.stage);
		if(this.props.animating) requestAnimationFrame(this.animate.bind(this));
	}

	shouldComponentUpdate() {
		return !this.mounted;
	}

	render() {
		return (
			<div ref="container"></div>
		)
	}

}

export default connect(({musicality, envelope, animating}) => ({musicality, envelope, animating}))(PrimaryInterface)