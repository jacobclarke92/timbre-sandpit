import React, { Component } from 'react'
import PIXI, { Container, Graphics, Rectangle } from 'pixi.js'

import { BEAT_PX } from '../../constants/globals'

export default class OriginRingNode extends Component {
	
	constructor(props) {
		super(props);
		const { id, nodeType, position, scale } = props.node;

		const graphic = new Graphics();
		const guides = new Graphics();
		const ring = new Graphics();
		this.node = new Container();
		this.node.graphic = graphic;
		this.node.guides = guides;
		this.node.ring = ring;

		graphic.lineStyle(2, 0xFFFFFF, 1);
		graphic.moveTo(0, -10);
		graphic.lineTo(0, 10);
		graphic.moveTo(-10, 0);
		graphic.lineTo(10, 0);
		graphic.cacheAsBitmap = true;

		this.drawGuides();

		this.node.id = id;
		this.node.nodeType = nodeType;
		this.node.inited = false;
		this.node.interactive = true;
		this.node.buttonMode = true;
		this.node.hitArea = new Rectangle(-10, -10, 20, 20);
		this.node.scale.set(scale);
		this.node.position.set(position.x, position.y);

		this.node.addChild(graphic);
		this.node.addChild(guides);
		this.node.addChild(ring);
	}

	drawGuides() {
		const { bars, beats } = this.props.node;
		const totalBeats = bars * beats;
		this.node.radius = totalBeats * BEAT_PX;
		this.node.guides.cacheAsBitmap = false;
		this.node.guides.clear();
		for(let beat = 0; beat < totalBeats+1; beat ++) {
			const bar = beat % beats === 0;
			if(bar) this.node.guides.lineStyle(2, 0xFFFFFF, 0.35);
			else this.node.guides.lineStyle(2, 0xFFFFFF, 0.15);
			this.node.guides.drawCircle(0, 0, BEAT_PX*beat);
		}
		this.node.guides.cacheAsBitmap = true;
	}

	render() {
		// draw ring
		return this.node;
	}
}