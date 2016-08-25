
import { beatPX } from './constants/globals'
import * as NoteTypes from './constants/noteTypes'
import noteColors from './constants/noteColors'

let store = null;
export function receiveStore(_store) {
	store = _store;
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

	node.totalBeats = attrs.bars * attrs.beats;
	node.radius = node.totalBeats * beatPX;
	node.guides.cacheAsBitmap = false;
	node.guides.clear();
	for(let beat = 0; beat < node.totalBeats+1; beat ++) {
		const bar = beat % attrs.beats === 0;
		if(bar) node.guides.lineStyle(2, 0xFFFFFF, 0.35);
		else node.guides.lineStyle(2, 0xFFFFFF, 0.15);
		node.guides.drawCircle(0, 0, beatPX*beat);
	}
	node.guides.cacheAsBitmap = true;
}