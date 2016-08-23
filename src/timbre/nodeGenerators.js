import PIXI, { Container, Graphics, Sprite } from 'pixi.js'

import newId from './utils/newId'
import Point from './Point'

import * as NoteTypes from './constants/noteTypes'

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

	node.id = newId();
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

	node.id = newId();
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

	const node = new Container();
	const graphic = new Graphics();

	node.id = newId();
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

	node.id = newId();
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
