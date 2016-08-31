import React, { Component } from 'react'
import PIXI, { Container, Graphics, Rectangle } from 'pixi.js'

import { createOriginLoop } from '../../timing'

export default class OriginRadarNode extends Component {

	constructor(props) {
		super(props);
		const { id, nodeType, position, radius, scale } = props.node;

		this.loop = createOriginLoop(props.node);

		const graphic = new Graphics();
		const guides = new Graphics();
		this.node = new Container();
		this.node.graphic = graphic;
		this.node.guides = guides;

		this.drawGuides();

		this.node.id = id,
		this.node.nodeType = nodeType;
		this.node.inited = false;
		this.node.interactive = true;
		this.node.buttonMode = true;
		this.node.hitArea = new Rectangle(-10, -10, 20, 20);
		this.node.radius = radius;
		this.node.scale.set(scale);
		this.node.position.set(position.x, position.y);
		
		this.node.addChild(guides);
		this.node.addChild(graphic);

		this.node.on('mousedown', props.onPointerDown);
		this.node.on('touchstart', props.onPointerDown);
		this.node.on('mouseup', props.onPointerUp);
		this.node.on('touchend', props.onPointerUp);
	}

	drawGuides() {
		const { bars, beats, radius } = this.props.node;

		const totalBeats = bars * beats;
		const radSeg = Math.PI*2 / totalBeats;
		this.node.guides.cacheAsBitmap = false;
		this.node.guides.clear();
		for(let beat = 0; beat < totalBeats; beat++) {
			const bar = beat % beats === 0;
			if(bar) this.node.guides.lineStyle(2, 0xFFFFFF, 0.35);
			else this.node.guides.lineStyle(2, 0xFFFFFF, 0.15);
			this.node.guides.moveTo(0,0);
			this.node.guides.lineTo(
				Math.cos(beat*radSeg)*radius,
				Math.sin(beat*radSeg)*radius
			);
		}
		this.node.guides.cacheAsBitmap = true;
	}
	
	render() {
		const { radius } = this.props.node;
		const theta = this.loop.progress * (Math.PI*2) + Math.PI;
		this.node.graphic.clear();
		this.node.graphic.lineStyle(2, 0xFFFFFF, 1);
		this.node.graphic.moveTo(0,0);
		this.node.graphic.lineTo(Math.cos(theta)*radius, Math.sin(theta)*radius);
		this.node.guides.renderable = this.props.showGuides;
		return this.node;
	}
}