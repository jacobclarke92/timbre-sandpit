import Tone, { Synth, Transport } from 'tone'
import _get from 'lodash/get'

import * as AnchorTypes from './constants/anchorTypes'

let store = null;
let lastNote = 0;


export function receiveStore(_store) {
	store = _store;
}

export function setBpm(bpm) {
	console.log('Updaing transport bpm', bpm);
	Transport.bpm.value = bpm;
}

export function getRandomNote() {
	if(!store) return;
	console.log('Getting random note');
	const notes = _get(store.getState(), 'musicality.notes');
	let note = notes[Math.floor(Math.random()*notes.length)];
	while(Math.abs(note-lastNote) % 12 <= 1) note = notes[Math.floor(Math.random()*notes.length)];
	lastNote = note;
	return note;
}

export function getAscendingNote() {
	if(!store) return;
	console.log('Getting ascending note');
	const notes = _get(store.getState(), 'musicality.notes');
	let index = notes.indexOf(lastNote);
	if(index >= notes.length-1) index = 0;
	else index ++;
	const note = notes[index];
	lastNote = note;
	return note;
}

export function getDescendingNote() {
	if(!store) return;
	console.log('Getting descending note');
	const notes = _get(store.getState(), 'musicality.notes');
	let index = notes.indexOf(lastNote);
	if(index === 0) index = notes.length-1;
	else index --;
	const note = notes[index];
	lastNote = note;
	return note;
}

export function playNote(volume = 1, pan = 0, noteType = AnchorTypes.RANDOM) {
	if(!store) return;
	console.log('Playing note');

	// get vars from store
	const state = store.getState();
	const { mode, scale, octave } = _get(state, 'musicality', {});
	const adsr = _get(state, 'envelope');
	const { waveform } = _get(state, 'sound', {});

	// decide what note ot play next
	let note = null;
	switch(noteType) {
		case AnchorTypes.UP: note = getAscendingNote(); break;
		case AnchorTypes.DOWN: note = getDescendingNote(); break;
		default: note = getRandomNote();
	}
	const freq = mode.degreeToFreq(note, (12*octave + scale).midicps(), 1);

	// create synth and play
	const synth = new Synth({
		envelope: adsr, 
		oscillator: {type: waveform}
	}).toMaster();
	synth.triggerAttackRelease(freq, 0);
	// synth.triggerAttack(freq, 0, volume); // dunno why this doesn't work
	// TODO: get volume to work again

	// not sure if there's a way to get an envelope complete callback ... so manually destroy for now
	setTimeout(() => synth.dispose(), adsr.attack*1000*adsr.max + adsr.decay*1000*adsr.max);
	
	return note;
}