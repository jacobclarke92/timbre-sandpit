import Tone, { Synth, Transport } from 'tone'
import _get from 'lodash/get'
import _cloneDeep from 'lodash/cloneDeep'

import * as NoteTypes from './constants/noteTypes'
import { getByKey } from './utils/arrayUtils'
import { checkDifferenceAny } from './utils/lifecycleUtils'

let store = null;
let oldSynths = null;
let lastNote = 0;

const Synths = {};

export function receiveStore(_store) {
	store = _store;
	store.subscribe(receivedState);
	oldSynths = _cloneDeep(store.getState().synths);
	receivedState();
}

function receivedState() {
	const { synths } = store.getState();

	for(let i=0; i<synths.length; i++) {
		const synth = synths[i];
		const prevSynth = oldSynths[i];
		if(!Synths[synth.id]) Synths[synth.id] = [];
		if(synth.waveform != prevSynth.waveform) {
			Synths[synth.id].forEach(voice => voice.oscillator.waveform = synth.waveform);
		}
		if(checkDifferenceAny(oldSynths.envelope, synths.envelope, ['attack', 'decay', 'sustain', 'release'])) {
			Synths[synth.id].forEach(voice => voice.envelope = synth.envelope);
		}
	}

	oldSynths = _cloneDeep(store.getState().synths);
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

export function requestSynthVoice(synth) {
	if(Object.keys(Synths).indexOf(synth.id.toString()) < 0) Synths[synth.id] = [];
	const availableVoices = Synths[synth.id].filter(voice => voice.available);
	if(availableVoices.length > 0) return availableVoices[0];

	const newSynth = new Synth({
		envelope: synth.envelope,
		oscillator: {type: synth.waveform},
		volume: -6,
	}).toMaster();
	Synths[synth.id].push(newSynth);
	console.log('allotting new synth voice. now there are now '+Synths[synth.id].length);
	return newSynth;
}

export function playNote(node, synthId) {
	if(!store) return;
	const volume = 1;
	const pan = 0;
	const noteType = node.noteType || NoteTypes.RANDOM;

	// get vars from store
	const state = store.getState();
	const synthData = getByKey(state.synths, synthId);
	if(!synthData) return;

	const synth = requestSynthVoice(synthData);

	const { mode, notes, scale, octave } = _get(state, 'musicality', {});
	const adsr = synthData.envelope;

	// decide what note ot play next
	let note = null;
	switch(noteType) {
		case NoteTypes.UP: note = getAscendingNote(); break;
		case NoteTypes.DOWN: note = getDescendingNote(); break;
		default: note = getRandomNote();
	}

	const freq = mode.degreeToFreq(note, (12*octave + scale).midicps(), 1);
	synth.available = false;
	synth.triggerAttackRelease(freq, 0);
	setTimeout(() => synth.available = true, (synthData.envelope.attack + synthData.envelope.release)*1000);
	
	return note;
}