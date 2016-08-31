import React, { Component } from 'react'
import PIXI, { Graphics } from 'pixi.js'

export default class ActiveNodeIndicator extends Component {

	constructor(props) {
		super(props);
		this.activeNodeIndicator = new Graphics();
		this.activeNodeIndicator.lineStyle(2, 0xFFFFFF, 0.5);
		this.activeNodeIndicator.drawCircle(0, 0, 15);
		this.activeNodeIndicator.cacheAsBitmap = true;
		this.indicatorOsc = 0;
	}

	render() {
		if(this.props.activeNode) {
			this.indicatorOsc = (this.indicatorOsc + 0.1) % (Math.PI*2);
			this.activeNodeIndicator.renderable = true;
			this.activeNodeIndicator.position = this.props.activeNode.position;
			this.activeNodeIndicator.scale.set(1 + Math.cos(this.indicatorOsc)*0.05);
		}else{
			this.activeNodeIndicator.renderable = false;
		}
		return this.activeNodeIndicator;
	}
}