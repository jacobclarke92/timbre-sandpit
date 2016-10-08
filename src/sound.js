import Tone, { Gain, BitCrusher, Vibrato, Synth, Transport } from 'tone'
import _get from 'lodash/get'
import _isEqual from 'lodash/isEqual'
import _cloneDeep from 'lodash/cloneDeep'

import modes from './constants/modes'
import * as NoteTypes from './constants/noteTypes'
import * as DeskItemTypes from './constants/deskItemTypes'
import { getByKey } from './utils/arrayUtils'
import { checkDifferenceAny } from './utils/lifecycleUtils'

let store = null;
let oldDesk = null;
let oldSynths = null;
let oldFXs = null;
let lastNote = 0;

const Synths = {};
const FXs = {};

const Submaster = new Gain({gain: 0.5}).toMaster();
const Bus2 = new BitCrusher({bits: 4}).connect(Submaster);
const Bus1 = new Vibrato({depth: 0.3}).connect(Bus2);

export function receiveStore(_store) {
	store = _store;
	store.subscribe(receivedState);

	const { synths, fx, desk } = store.getState();
	oldFXs = _cloneDeep(fx);
	oldDesk = _cloneDeep(desk);
	oldSynths = _cloneDeep(synths);

	receivedState();
	initFx();
	connectAllWires();
}

function receivedState() {
	const { synths, fx, desk } = store.getState();

	for(let synth of synths) {
		// creates space for synth voices
		if(!Synths[synth.id]) Synths[synth.id] = [];

		const prevSynth = getByKey(oldSynths, synth.id);
		// updates waveform of synth voices if changed
		if(prevSynth && synth.waveform != prevSynth.waveform) {
			console.log('Updating synth '+synth.id+' waveform');
			Synths[synth.id].forEach(voice => voice.oscillator.waveform = synth.waveform);
		}

		// updates envelope of synth voices if changed
		if(prevSynth && checkDifferenceAny(prevSynth.envelope, synth.envelope, ['attack', 'decay', 'sustain', 'release'])) {
			console.log('Updating synth '+synth.id+' envelope');
			Synths[synth.id].forEach(voice => voice.envelope = synth.envelope);
		}
	}
	// todo: clean up old synth instances -- e.g. if deleted
	
	// init any new effects
	for(let effect of fx) {
		if(!FXs[effect.id] && effect.type in Tone) {
			const deskEffect = getByKey(desk, effect.id, 'ownerId');
			FXs[effect.id] = new Tone[effect.type](effect.params);
			connectAudioWires(FXs[effect.id], effect.id);
		}
	}

	// checks all connections and rewires if needed
	for(let deskItem of desk) {
		const prevDeskItem = getByKey(oldDesk, deskItem.id);
		if(deskItem.audioOutput) {
			if(prevDeskItem && !_isEqual(Object.keys(prevDeskItem.audioOutputs), Object.keys(deskItem.audioOutputs))) {
				if(deskItem.type == DeskItemTypes.FX) {
					console.log('Updating fx '+deskItem.ownerId+' output connections');
					connectAudioWires(FXs[deskItem.ownerId], deskItem.ownerId, true);	
				}else if(deskItem.type == DeskItemTypes.SYNTH) {
					console.log('Updating synth '+deskItem.ownerId+' output connections');
					Synths[deskItem.ownerId].forEach(synth => connectAudioWires(synth, deskItem.ownerId, true));
				}
				
			}
		}
	}

	oldFXs = _cloneDeep(fx);
	oldDesk = _cloneDeep(desk);
	oldSynths = _cloneDeep(synths);
}

export function initFx() {
	const { fx, desk } = store.getState();
	for(let effect of fx) {
		if(effect.type in Tone) {
			const deskEffect = getByKey(desk, effect.id, 'ownerId');
			FXs[effect.id] = new Tone[effect.type](effect.params);
			connectAudioWires(FXs[effect.id], effect.id);
		}else{
			console.warn('Unknown Effect: '+effect.type);
		}
	}
}

export function connectAllWires() {

}

export function connectAudioWires(source, id, disconnectFirst = false) {
	if(!source) console.warn('no source to connect from', source, id, FXs);
	if(!source || !id) return;
	
	const { desk } = store.getState();
	const deskItem = getByKey(desk, id, 'ownerId');
	if(!deskItem) return;

	const connections = [];
	Object.keys(deskItem.audioOutputs).forEach(connectToId => {
		if(connectToId == 'master') {
			connections.push(Tone.Master);
		}else{
			if(Object.keys(FXs).indexOf(connectToId) >= 0) {
				connections.push(FXs[connectToId]);
			}
			// todo: buses
		}
	});
	
	if(disconnectFirst) source.disconnect();
	console.log('Connecting sound source '+id+' to', connections);
	source.fan.apply(source, connections);
}

export function requestSynthVoice(synth) {
	if(Object.keys(Synths).indexOf(synth.id.toString()) < 0) Synths[synth.id] = [];
	const availableVoices = Synths[synth.id].filter(voice => voice.available);
	if(availableVoices.length > 0) return availableVoices[0];

	// console.log(synth.id, deskSynth, desk.map(item => item.ownerId));
	const newSynth = new Synth({
		envelope: synth.envelope,
		oscillator: {type: synth.waveform},
		volume: -6,
	});

	connectAudioWires(newSynth, synth.id);

	Synths[synth.id].push(newSynth);
	console.log('Allotting new synth voice. now there are now '+Synths[synth.id].length);
	return newSynth;
}

export function getRandomNote() {
	if(!store) return;
	// console.log('Getting random note');
	const notes = _get(store.getState(), 'musicality.notes');
	let note = notes[Math.floor(Math.random()*notes.length)];
	while(Math.abs(note-lastNote) % 12 <= 1) note = notes[Math.floor(Math.random()*notes.length)];
	lastNote = note;
	return note;
}

export function getAscendingNote() {
	if(!store) return;
	// console.log('Getting ascending note');
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
	// console.log('Getting descending note');
	const notes = _get(store.getState(), 'musicality.notes');
	let index = notes.indexOf(lastNote);
	if(index === 0) index = notes.length-1;
	else index --;
	const note = notes[index];
	lastNote = note;
	return note;
}

export function playNote(node, synthId) {
	if(!store) return;
	const volume = 1;
	const pan = 0;
	const noteType = node.noteType || NoteTypes.RANDOM;

	// get vars from store
	const state = store.getState();
	const synthData = synthId ? getByKey(state.synths, synthId) : state.synths[0];
	if(!synthData) return;

	const synth = requestSynthVoice(synthData);

	const { modeString, notes, scale, octave } = _get(state, 'musicality', {});
	const adsr = synthData.envelope;

	// decide what note ot play next
	let note = null;
	switch(noteType) {
		case NoteTypes.UP: note = getAscendingNote(); break;
		case NoteTypes.DOWN: note = getDescendingNote(); break;
		case NoteTypes.NOTE: note = notes[node.noteIndex % notes.length]; break;
		case NoteTypes.SPECIFIC: note = node.noteIndex; break;
		default: note = getRandomNote();
	}

	const mode = modes[modeString];
	const freq = mode.degreeToFreq(note, (12*octave + scale).midicps(), 1);
	synth.available = false;
	synth.triggerAttackRelease(freq, 0);
	setTimeout(() => synth.available = true, (synthData.envelope.attack + synthData.envelope.release)*1000);
	
	return note;
}