import React, { Component } from 'react'
import PIXI, { Container, Graphics } from 'pixi.js'
import deepEqual from 'deep-equal'

import Style from '../../constants/style'
import { hexToDec } from '../../utils/colorUtils'

export default class DeskWire extends Component {

	static defaultProps = {
		valid: null,
		selected: false,
		isLive: false,
	};

	constructor(props) {
		super(props);
		this.node = new Container();
		const graphic = new Graphics();

		if(!props.isLive) {
			graphic.interactive = true;
			graphic.buttonMode = true;
			graphic.on('mousedown', event => event.stopPropagation());
			graphic.on('touchstart', event => event.stopPropagation());
			graphic.on('mouseup', event => { event.stopPropagation(); props.onSelect(); });
			graphic.on('touchend', event => { event.stopPropagation(); props.onSelect(); });
			graphic.on('mouseover', event => { this.over = true; this.drawWire(); });
			graphic.on('mouseout', event => { this.over = false; this.drawWire(); });
		}

		this.node.graphic = graphic;
		this.node.addChild(graphic);
		this.drawWire(props);
		this.over = false;
	}

	drawWire(props = this.props) {
		const alpha = this.over ? 0.5 : 1;
		const thickness = props.selected ? 12 : 8;
		const color = props.valid === true ? Style.primary : (props.valid === false ? Style.error : Style.lightGrey);
		this.node.graphic.cacheAsBitmap = false;
		this.node.graphic.clear();
		this.node.graphic.lineStyle(thickness, hexToDec(color), alpha);
		this.node.graphic.moveTo(props.from.x, props.from.y);
		this.node.graphic.lineTo(props.to.x, props.to.y);
		this.node.graphic.cacheAsBitmap = true;
	}

	componentWillReceiveProps(nextProps) {
		if(!deepEqual(nextProps.from, this.props.from)
		 || !deepEqual(nextProps.to, this.props.to)
		 || nextProps.valid != this.props.valid
		 || nextProps.selected != this.props.selected) {
			this.drawWire(nextProps);
		}
	}

	render() {
		return this.node;
	}
}