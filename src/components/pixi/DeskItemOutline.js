import React, { Component } from 'react'
import PIXI, { Container, Graphics } from 'pixi.js'

export default class DeskItemOutline extends Component {

	static defaultProps = {
		color: '#222222',
		backgroundColor: '#eeeeee',
		borderRadius: 10,
		width: 200,
		height: 200,
		padding: 30,
		lineWidth: 1,
	};

	constructor(props) {
		super(props);
		this.node = new Container();
		this.node.position = {x: props.position.x - props.width/2, y: props.position.y - props.height/2};
		this.node.graphic = new Graphics();
		this.draw(props);
		this.node.addChild(this.node.graphic);
	}

	draw(props = this.props) {
		this.node.graphic.cacheAsBitmap = false;
		this.node.graphic.clear();
		this.node.graphic.lineStyle(3/props.lineWidth, eval(props.backgroundColor.replace('#', '0x')), 0.5);
		this.node.graphic.drawRoundedRect(0, 0, props.width, props.height, props.borderRadius);
		this.node.graphic.cacheAsBitmap = true;
	}

	componentWillReceiveProps(nextProps) {
		if(nextProps.lineWidth != this.props.lineWidth) this.draw();
		if(nextProps.position.x != this.props.position.x || nextProps.position.y != this.props.position.y) {
			this.node.position = {x: nextProps.position.x - nextProps.width/2, y: nextProps.position.y - nextProps.height/2};
		}
	}

	render() {
		return this.node;
	}
}