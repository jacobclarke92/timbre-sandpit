import React, { Component } from 'react'
import PIXI, { Container, Graphics } from 'pixi.js'
import deepEqual from 'deep-equal'

export default class DeskWire extends Component {

	constructor(props) {
		super(props);
		this.node = new Container();
		const graphic = new Graphics();

		this.node.graphic = graphic;
		this.node.addChild(graphic);
	}

	drawWire(props = this.props) {
		this.node.graphic.cacheAsBitmap = false;
		this.node.graphic.clear();
		this.node.graphic.lineStyle(8, 0xCCCCCC, 1);
		this.node.graphic.moveTo(props.from.x, props.from.y);
		this.node.graphic.lineTo(props.to.x, props.to.y);
		this.node.graphic.cacheAsBitmap = true;
	}

	componentWillReceiveProps(nextProps) {
		if(!deepEqual(nextProps.from, this.props.from) || !deepEqual(nextProps.to, this.props.to)) {
			this.drawWire(nextProps);
		}
	}

	render() {
		return this.node;
	}
}