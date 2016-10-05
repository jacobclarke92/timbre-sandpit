import React, { Component } from 'react'
import ReactDOMServer from 'react-dom/server'
import PIXI, { Container, Graphics, Text } from 'pixi.js'
import SVGGraphics from 'pixi-svg-graphics'
import $ from 'jquery'

import Icons from '../../constants/icons'
import { getPixelDensity } from '../../utils/screenUtils'

export default class PointNode extends Component {

	constructor(props) {
		super(props);

		const iconPath = ReactDOMServer.renderToStaticMarkup(Icons['volume-mute']);
		this.$icon = $('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="200" height="200">'+iconPath+'</svg>');
		this.$icon.find('path').attr('fill', '#222222');

		this.node = new Container();
		const graphic = new Graphics();
		const icon = new Graphics();
		const label = new Text('', {
			font: '20px Orbitron', 
			fontWeight: '500', 
			align: 'center',
			fill: '#222222',
			wordWrap: true,
			wordWrapWidth: 190,
		});
		label.scale.set(1/getPixelDensity());
		label.anchor.set(0.5);
		label.position = {x: 100, y: 170};
		label.interactive = true;
		label.buttonMode = true;
		icon.position = {x: 20, y: 5};

		this.node.icon = icon;
		this.node.graphic = graphic;
		this.node.label = label;
		this.drawDeskMaster(props);
		this.node.addChild(graphic);
		this.node.addChild(icon);
		this.node.addChild(label);

		this.node.inited = false;
		this.node.interactive = true;
		this.node.buttonMode = true;
		this.node.position.set(props.position.x, props.position.y);

		// this.node.on('mousedown', props.onPointerDown);
		// this.node.on('touchstart', props.onPointerDown);
		// this.node.on('mouseup', props.onPointerUp);
		// this.node.on('touchend', props.onPointerUp);
		label.on('mousedown', event => { props.onRename(); event.stopPropagation(); });
	}

	drawDeskMaster(props = this.props) {

		this.node.graphic.cacheAsBitmap = false;
		this.node.graphic.clear();
		this.node.graphic.beginFill(0xEEEEEE);
		this.node.graphic.drawRoundedRect(0, 0, 200, 200, 10);
		this.node.graphic.cacheAsBitmap = true;

		// this.node.icon.cacheAsBitmap = false;
		this.node.icon.scale.set(6);
		SVGGraphics.drawSVG(this.node.icon, this.$icon[0]);
		// this.node.icon.cacheAsBitmap = true;
		
		this.node.label.text = props.name || 'Master';
	}

	componentWillReceiveProps(nextProps) {
		if(nextProps.name != this.props.name) this.drawDeskMaster(nextProps);
	}

	render() {
		return this.node;
	}
}