import React, { Component } from 'react'
import PIXI, { Container, Graphics } from 'pixi.js'

import noteColors from '../../constants/noteColors'
import * as NoteTypes from '../../constants/noteTypes'
import { checkDifferenceAny } from '../../utils/lifecycleUtils'

export default class ArcNode extends Component {
	
	constructor(props) {
		super(props);
		const { id, nodeType, noteType, position, thickness, scale, startAngle, endAngle } = props.node;

		this.node = new Container();
		const graphic = new Graphics();
		this.node.graphic = graphic;
		this.drawArcNode(props);
		this.node.addChild(graphic);

		this.node.id = id;
		this.node.nodeType = nodeType;
		this.node.inited = false;
		this.node.interactive = true;
		this.node.buttonMode = true;
		this.node.noteType = noteType;
		this.node.scale.set(scale);
		this.node.position.set(position.x, position.y);

		// this.node.on('mousedown', props.onPointerDown);
		// this.node.on('touchstart', props.onPointerDown);
		// this.node.on('mouseup', props.onPointerUp);
		// this.node.on('touchend', props.onPointerUp);

	}

	drawArcNode(props = this.props) {
		const { scale, notes } = props;
		const { noteType, noteIndex, thickness, radius, startAngle, endAngle } = props.node;

		let color = 0xFFFFFF;
		switch(noteType) {
			// case NoteTypes.UP:
			// 	this.node.rotation = -Math.PI/2;
			// 	break;
			// case NoteTypes.DOWN:
			// 	this.node.rotation = Math.PI/2;
			// 	break;
			case NoteTypes.NOTE:
				const note = (scale + notes[noteIndex % notes.length]) % 12;
				color = noteColors[note];
				break;
		}
		this.node.graphic.cacheAsBitmap = false;
		this.node.graphic.clear();
		this.node.graphic.lineStyle(thickness, color);
		this.node.graphic.arc(0,0,radius,startAngle,endAngle);
		if(noteType == NoteTypes.UP || noteType == NoteTypes.DOWN) {
			this.node.graphic.drawPolygon([
				0,-radius, 
				0, radius,
				radius*3, 0,
			]);
		}
		this.node.graphic.cacheAsBitmap = true;
	}

	render() {
		return this.node;
	}
}