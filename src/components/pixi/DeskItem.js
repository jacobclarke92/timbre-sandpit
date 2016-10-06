import React, { Component } from 'react'
import ReactDOMServer from 'react-dom/server'
import PIXI, { Container, Graphics, Text } from 'pixi.js'
import SVGGraphics from 'pixi-svg-graphics'
import $ from 'jquery'

import Icons from '../../constants/icons'
import { getPixelDensity } from '../../utils/screenUtils'
import * as DeskItemTypes from '../../constants/deskItemTypes'

const icons = {
	[DeskItemTypes.OSCILLATOR]: 'waveform',
	[DeskItemTypes.MASTER]: 'volume-mute',
	[DeskItemTypes.SYNTH]: 'piano',
	[DeskItemTypes.FX]: 'sliders',
};

export default class DeskItem extends Component {

	static defaultProps = {
		color: '#222222',
		backgroundColor: '#eeeeee',
		borderRadius: 10,
	};

	constructor(props) {
		super(props);

		const iconPath = ReactDOMServer.renderToStaticMarkup(Icons[icons[props.type] || 'volume-mute']);
		this.$icon = $('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="200" height="200">'+iconPath+'</svg>');
		this.$icon.find('path').attr('fill', props.color);

		this.node = new Container();
		const graphic = new Graphics();
		const icon = new Graphics();
		const label = new Text('', {
			font: '20px Orbitron', 
			fontWeight: '500', 
			align: 'center',
			fill: props.color,
			wordWrap: true,
			wordWrapWidth: 190,
		});
		label.scale.set(1/getPixelDensity());
		label.anchor.set(0.5);
		label.position = {x: 100, y: 170};
		label.interactive = true;
		label.buttonMode = true;
		icon.position = {x: 20, y: 5};

		this.node.id = props.id;
		this.node.icon = icon;
		this.node.graphic = graphic;
		this.node.label = label;
		this.drawDeskMaster(props);
		this.node.addChild(graphic);
		this.node.addChild(icon);
		this.node.addChild(label);

		if(props.input) {
			this.node.inputNode = this.createNodeIO('input');
			this.node.addChild(this.node.inputNode);
		}

		if(props.output) {
			this.node.outputNode = this.createNodeIO('output');
			this.node.addChild(this.node.outputNode);
		}

		this.node.inited = false;
		this.node.interactive = true;
		this.node.buttonMode = true;
		this.node.position.set(props.position.x, props.position.y);

		this.node.on('mousedown', props.onPointerDown);
		this.node.on('touchstart', props.onPointerDown);
		this.node.on('mouseup', props.onPointerUp);
		this.node.on('touchend', props.onPointerUp);
		label.on('mousedown', event => { props.onRename(); event.stopPropagation(); });
	}

	createNodeIO(type) {
		const ioNode = new Graphics();
		ioNode.beginFill(type == 'output' ? 0xC0FDFB : 0xFEE9E1);
		ioNode.drawCircle(type == 'output' ? 200 : 0, 100, 15);
		ioNode.cacheAsBitmap = true;
		ioNode.interactive = true;
		ioNode.buttonMode = true;
		ioNode.pivot.set(0.5);
		ioNode.type = type;
		ioNode.on('mouseover', event => { ioNode.alpha = 0.9; this.props.onOverIO(event, type) });
		ioNode.on('mouseout', event => { ioNode.alpha = 1; this.props.onOverIO(event, null) });
		ioNode.on('mousedown', this.props.onPointerDownIO);
		ioNode.on('touchstart', this.props.onPointerDownIO);
		return ioNode;
	}

	drawDeskMaster(props = this.props) {

		this.node.graphic.cacheAsBitmap = false;
		this.node.graphic.clear();
		this.node.graphic.beginFill(eval(props.backgroundColor.replace('#', '0x')));
		this.node.graphic.drawRoundedRect(0, 0, 200, 200, props.borderRadius);
		this.node.graphic.cacheAsBitmap = true;

		// this.node.icon.cacheAsBitmap = false;
		this.node.icon.scale.set(6);
		SVGGraphics.drawSVG(this.node.icon, this.$icon[0]);
		const iconBounds = this.node.icon.getBounds();
		this.node.icon.scale.set(100/iconBounds.height);//, 100/iconBounds.height);
		this.node.icon.position.x = 50;
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