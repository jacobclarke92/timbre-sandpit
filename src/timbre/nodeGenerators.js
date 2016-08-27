import PIXI, { Container, Graphics, Sprite, Rectangle } from 'pixi.js'

import newId from './utils/newId'
import Point from './Point'

import { redrawPointNode, redrawRingGuides } from './nodeGraphics'

let store = null;
export function receiveStore(_store) {
	store = _store;
}

const defaultNodeAttrs = {
	position: new Point(0,0),
	scale: 1,
};

export function createRingNode(_attrs) {
	const attrs = {...defaultNodeAttrs, ..._attrs};
	const state = store.getState();

	const node = new Container();
	const graphic = new Graphics();
	const guides = new Graphics();
	const ring = new Graphics();
	node.graphic = graphic;
	node.guides = guides;
	node.ring = ring;

	graphic.lineStyle(2, 0xFFFFFF, 1);
	graphic.moveTo(0, -10);
	graphic.lineTo(0, 10);
	graphic.moveTo(-10, 0);
	graphic.lineTo(10, 0);
	graphic.cacheAsBitmap = true;

	redrawRingGuides(attrs, node);

	node.id = attrs.id || newId();
	node.nodeType = attrs.nodeType;
	node.inited = false;
	node.interactive = true;
	node.buttonMode = true;
	node.hitArea = new Rectangle(-10, -10, 20, 20);
	node.scale.set(attrs.scale);
	node.position.set(attrs.position.x, attrs.position.y);

	node.addChild(graphic);
	node.addChild(ring);
	node.addChild(guides);

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
	node.graphic = graphic;
	redrawPointNode(attrs, node);
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
	node.scheduledNotes = [];
	 
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
