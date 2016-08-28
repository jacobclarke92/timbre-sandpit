import { Graphics } from 'pixi.js'

import { BEAT_PX } from './constants/globals'
import noteColors from './constants/noteColors'
import * as NoteTypes from './constants/noteTypes'

let store = null;
export function receiveStore(_store) {
	store = _store;
}

export function createRingFX(position, color) {
	const ring = new Graphics();
	ring.lineStyle(3, color, 1);
	ring.drawCircle(0, 0, BEAT_PX*3);
	ring.cacheAsBitmap = true;
	ring.scale.set(0);
	ring.position = position;
	ring.counter = 0;
	return ring;
}

export function redrawPointNode(attrs, node) {
	if(!attrs || !node) return;

	const state = store.getState();
	const { scale, notes } = state.musicality;
	
	let color = 0xFFFFFF;
	switch(attrs.noteType) {
		case NoteTypes.UP:
			node.rotation = -Math.PI/2;
			break;
		case NoteTypes.DOWN:
			node.rotation = Math.PI/2;
			break;
		case NoteTypes.NOTE:
			const note = (scale + notes[attrs.noteIndex % notes.length]) % 12;
			color = noteColors[note];
			break;
	}
	node.graphic.cacheAsBitmap = false;
	node.graphic.clear();
	node.graphic.beginFill(color);
	node.graphic.drawCircle(0, 0, attrs.radius);
	if(attrs.noteType == NoteTypes.UP || attrs.noteType == NoteTypes.DOWN) {
		node.graphic.drawPolygon([
			0,-attrs.radius, 
			0, attrs.radius,
			attrs.radius*3, 0,
		]);
	}
	node.graphic.cacheAsBitmap = true;
}

export function redrawRingGuides(attrs, node) {
	if(!attrs || !node) return;

	const totalBeats = attrs.bars * attrs.beats;
	node.radius = totalBeats * BEAT_PX;
	node.guides.cacheAsBitmap = false;
	node.guides.clear();
	for(let beat = 0; beat < totalBeats+1; beat ++) {
		const bar = beat % attrs.beats === 0;
		if(bar) node.guides.lineStyle(2, 0xFFFFFF, 0.35);
		else node.guides.lineStyle(2, 0xFFFFFF, 0.15);
		node.guides.drawCircle(0, 0, BEAT_PX*beat);
	}
	node.guides.cacheAsBitmap = true;
}

export function redrawRadarGuides(attrs, node) {
	if(!attrs || !node) return;

	const totalBeats = attrs.bars * attrs.beats;
	const radSeg = Math.PI*2 / totalBeats;
	node.guides.cacheAsBitmap = false;
	node.guides.clear();
	for(let beat = 0; beat < totalBeats; beat++) {
		const bar = beat % attrs.beats === 0;
		if(bar) node.guides.lineStyle(2, 0xFFFFFF, 0.35);
		else node.guides.lineStyle(2, 0xFFFFFF, 0.15);
		node.guides.moveTo(0,0);
		node.guides.lineTo(
			Math.cos(beat*radSeg)*attrs.radius,
			Math.sin(beat*radSeg)*attrs.radius
		);
	}
	node.guides.cacheAsBitmap = true;
}