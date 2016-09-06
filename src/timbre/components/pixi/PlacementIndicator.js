import React, { Component } from 'react'
import PIXI, { Graphics } from 'pixi.js'

export default class PlacementIndicator extends Component {

	constructor(props) {
		super(props);
		this.placementIndicator = new Graphics();
		this.placementIndicator.lineStyle(2, 0xFFFFFF, 0.5);
		this.placementIndicator.moveTo(0, -15);
		this.placementIndicator.lineTo(0, 15);
		this.placementIndicator.moveTo(-15, 0);
		this.placementIndicator.lineTo(15, 0);
		this.placementIndicator.cacheAsBitmap = true;
	}

	render() {
		this.placementIndicator.position = this.props.pointer;
		return this.placementIndicator;
	}
}

