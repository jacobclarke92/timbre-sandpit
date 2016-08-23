import PIXI, { Container, Graphics, Sprite } from 'pixi.js'

import newId from './utils/newId'
import Point from './Point'

import * as NoteTypes from './constants/noteTypes'
import noteColors from './constants/noteColors'

let store = null;
export function receiveStore(_store) {
	store = _store;
}

const defaultNodeAttrs = {
	position: new Point(0,0),
	scale: 1,
	radius: 4,
	noteType: NoteTypes.RANDOM,
};

export function createRingNode(_attrs) {
	const attrs = {...defaultNodeAttrs, ..._attrs};

	const node = new Container();
	const graphic = new Graphics();

	node.id = attrs.id || newId();
	node.nodeType = attrs.nodeType;
	node.inited = false;
	node.interactive = true;
	node.buttonMode = true;
	node.radius = attrs.radius;
	node.scale.set(attrs.scale);
	node.position.set(attrs.position.x, attrs.position.y);

	graphic.beginFill(0xFFFFFF);
	graphic.drawCircle(0, 0, node.radius);
	node.graphic = graphic;
	node.addChild(graphic);

	return node;
}

export function createRadarNode(_attrs) {
	const attrs = {...defaultNodeAttrs, ..._attrs};

	const node = new Container();
	const graphic = new Graphics();

	node.id = attrs.id || newId();
	node.nodeType = attrs.nodeType;
	node.inited = false;
	node.interactive = true;
	node.buttonMode = true;
	node.radius = attrs.radius;
	node.scale.set(attrs.scale);
	node.position.set(attrs.position.x, attrs.position.y);
	node.graphic = graphic;
	// node.addChild(graphic);
	 
	return node;
}

export function createPointNode(_attrs) {
	const attrs = {...defaultNodeAttrs, ..._attrs};
	const state = store.getState();

	const node = new Container();
	const graphic = new Graphics();

	let color = 0xFFFFFF;
	switch(attrs.noteType) {
		case NoteTypes.UP: 
			color = 0x5D8FFF; 
			node.rotation -= Math.PI/2;
			break;
		case NoteTypes.DOWN: 
			color = 0xFF489E; 
			node.rotation += Math.PI/2;
			break;
		case NoteTypes.NOTE:
			const note = (state.musicality.scale + state.musicality.notes[attrs.noteIndex]) % 12;
			color = noteColors[note];
			break;
	}
	graphic.beginFill(color);
	graphic.drawCircle(0, 0, attrs.radius);
	if(attrs.noteType == NoteTypes.UP || attrs.noteType == NoteTypes.DOWN) {
		graphic.drawPolygon([
			0,-attrs.radius, 
			0, attrs.radius,
			attrs.radius*3, 0,
		]);
	}
	graphic.cacheAsBitmap = true;
	node.graphic = graphic;
	node.addChild(graphic);

	node.id = attrs.id || newId();
	node.nodeType = attrs.nodeType;
	node.inited = false;
	node.interactive = true;
	node.buttonMode = true;
	node.noteType = attrs.noteType;
	node.radius = attrs.radius;
	node.scale.set(attrs.scale);
	node.position.set(attrs.position.x, attrs.position.y);
	node.graphic = graphic;
	// node.addChild(graphic);
	 
	return node;
}

export function createArcNode(_attrs) {
	const attrs = {...defaultNodeAttrs, ..._attrs};

	const node = new Container();
	const graphic = new Graphics();

	node.id = attrs.id || newId();
	node.nodeType = attrs.nodeType;
	node.inited = false;
	node.interactive = true;
	node.buttonMode = true;
	node.noteType = attrs.noteType;
	node.radius = attrs.radius;
	node.scale.set(attrs.scale);
	node.position.set(attrs.position.x, attrs.position.y);
	node.graphic = graphic;
	// node.addChild(graphic);
	 
	return node;
}
