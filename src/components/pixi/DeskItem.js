import React, { Component } from 'react'
import ReactDOMServer from 'react-dom/server'
import PIXI, { Container, Graphics, Text } from 'pixi.js'
import SVGGraphics from 'pixi-svg-graphics'
import $ from 'jquery'

import Icons from '../../constants/icons'
import Style from '../../constants/style'
import * as DeskItemTypes from '../../constants/deskItemTypes'

import { getPixelDensity } from '../../utils/screenUtils'
import { hexToDec } from '../../utils/stringUtils'

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
		params: [],
		width: 200,
		height: 200,
		padding: 30,
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
			wordWrapWidth: props.width-10,
		});
		label.scale.set(1/getPixelDensity());
		label.anchor.set(0.5);
		label.position = {x: props.width*0.5, y: props.height*0.85};
		label.interactive = true;
		label.buttonMode = true;
		icon.position = {x: 20, y: 5};

		this.node.id = props.id;
		this.node.ownerId = props.ownerId;
		this.node.icon = icon;
		this.node.graphic = graphic;
		this.node.label = label;
		this.drawDeskMaster(props);
		this.node.addChild(graphic);
		this.node.addChild(icon);
		this.node.addChild(label);

		if(props.audioInput) {
			this.node.audioInputNode = this.createNodeIO('Audio Input', 'audio', 'input', 0, props.height/2);
			this.node.addChild(this.node.audioInputNode);
		}

		if(props.audioOutput) {
			this.node.audioOutputNode = this.createNodeIO('Audio Output', 'audio', 'output', props.width, props.height/2);
			this.node.addChild(this.node.audioOutputNode);
		}

		if(props.dataInput) {
			this.node.dataInputNodes = [];
			const xPart = (props.width - props.padding*2)/(props.params.length-1);
			for(let i = 0; i < props.params.length; i ++) {
				const param = props.params[i];
				const x = props.padding + (i * xPart);
				let io = null;
				switch(props.type) {
					case DeskItemTypes.FX: io = 'input'; break;
					case DeskItemTypes.OSCILLATOR: io = 'output'; break;
				}
				const dataInputNode = this.createNodeIO(param.label, 'data', io, x, props.height);
				this.node.addChild(dataInputNode);
				this.node.dataInputNodes.push(dataInputNode);
			}
		}

		if(props.dataOutput) {
			this.node.dataOutputNodes = [];
			const dataOutputNode = this.createNodeIO('[Data Output]', 'data', 'output', props.width/2, 0);
			this.node.addChild(dataOutputNode);
			this.node.dataOutputNodes.push(dataOutputNode);
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

	createNodeIO(label, type, io, x, y) {
		let color = '#ffffff';
		switch(type) {
			case 'audio': color = (io == 'input' ? Style.primary : Style.primaryLight); break;
			case 'data': color = (io == 'input' ? Style.secondary : Style.secondaryLight); break;
		}
		color = hexToDec(color);
		const ioNode = new Graphics();
		ioNode.position = {x, y};
		ioNode.beginFill(color);
		ioNode.drawCircle(0, 0, 15);
		ioNode.cacheAsBitmap = true;
		ioNode.interactive = true;
		ioNode.buttonMode = true;
		ioNode.pivot.set(0.5);
		ioNode.io = io;
		ioNode.type = type;
		ioNode.on('mouseover', event => { ioNode.alpha = 0.9; this.props.onOverIO(event, type, io) });
		ioNode.on('mouseout', event => { ioNode.alpha = 1; this.props.onOverIO(event, null) });
		ioNode.on('mousedown', event => this.props.onPointerDownIO(event, type, io));
		ioNode.on('touchstart', event => this.props.onPointerDownIO(event, type, io));
		return ioNode;
	}

	drawDeskMaster(props = this.props) {

		this.node.graphic.cacheAsBitmap = false;
		this.node.graphic.clear();
		this.node.graphic.beginFill(eval(props.backgroundColor.replace('#', '0x')));
		this.node.graphic.drawRoundedRect(0, 0, props.width, props.height, props.borderRadius);
		this.node.graphic.cacheAsBitmap = true;

		this.node.icon.scale.set(6);
		SVGGraphics.drawSVG(this.node.icon, this.$icon[0]);
		const iconBounds = this.node.icon.getBounds();
		this.node.icon.scale.set(100/iconBounds.height);
		this.node.icon.position.x = 50;

		this.node.label.text = props.name || 'Master';
	}

	componentWillReceiveProps(nextProps) {
		if(nextProps.name != this.props.name) this.drawDeskMaster(nextProps);
	}

	render() {
		return this.node;
	}
}