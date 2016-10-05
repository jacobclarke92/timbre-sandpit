import React, { Component } from 'react'
import ReactDOMServer from 'react-dom/server'
import PIXI, { Container, Graphics } from 'pixi.js'
import SVGGraphics from 'pixi-svg-graphics'
import $ from 'jquery'

import Icons from '../../constants/icons'

export default class PointNode extends Component {

	constructor(props) {
		super(props);

		const iconPath = ReactDOMServer.renderToStaticMarkup(Icons['volume-mute']);
		this.$icon = $('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="200" height="200">'+iconPath+'</svg>');
		this.$icon.find('path').attr('fill', '#222222');

		this.node = new Container();
		const graphic = new Graphics();
		const icon = new Graphics();
		this.node.icon = icon;
		this.node.graphic = graphic;
		this.drawDeskMaster(props);
		this.node.addChild(graphic);
		this.node.addChild(icon);

		this.node.inited = false;
		this.node.interactive = true;
		this.node.buttonMode = true;
		this.node.position.set(props.position.x, props.position.y);

		// this.node.on('mousedown', props.onPointerDown);
		// this.node.on('touchstart', props.onPointerDown);
		// this.node.on('mouseup', props.onPointerUp);
		// this.node.on('touchend', props.onPointerUp);
	}

	drawDeskMaster(props = this.props) {

		this.node.graphic.cacheAsBitmap = false;
		this.node.graphic.clear();
		this.node.graphic.beginFill(0xEEEEEE);
		this.node.graphic.drawRect(0, 0, 200, 200);
		this.node.graphic.cacheAsBitmap = true;

		// this.node.icon.cacheAsBitmap = false;
		this.node.icon.scale.set(8);
		SVGGraphics.drawSVG(this.node.icon, this.$icon[0]);
		// this.node.icon.cacheAsBitmap = true;
	}

	render() {
		return this.node;
	}
}