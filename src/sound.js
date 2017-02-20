import Tone, { Gain, BitCrusher, Vibrato, Synth, LFO, Transport } from 'tone'
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
let oldLfos = null;
let lastNote = 0;

const Synths = {};
const FXs = {};
const LFOs = {};

const Submaster = new Gain({gain: 0.5}).toMaster();
const Bus2 = new BitCrusher({bits: 4}).connect(Submaster);
const Bus1 = new Vibrato({depth: 0.3}).connect(Bus2);

export function receiveStore(_store) {
	store = _store;
	store.subscribe(receivedState);

	const { synths, fx, lfos, desk } = store.getState();
	oldFXs = _cloneDeep(fx);
	oldLfos = _cloneDeep(lfos);
	oldDesk = _cloneDeep(desk);
	oldSynths = _cloneDeep(synths);

	receivedState();
	initFx();
	initLfos();
	connectAllWires();
}

function receivedState() {
	const { synths, fx, lfos, desk } = store.getState();

	for(let synth of synths) {
		// creates space for synth voices
		if(!Synths[synth.id]) Synths[synth.id] = [];

		const prevSynth = getByKey(oldSynths, synth.id);
		// updates waveform of synth voices if changed
		if(prevSynth && synth.waveform != prevSynth.waveform) {
			console.log('Updating synth '+synth.id+' waveform');
			Synths[synth.id].forEach(voice => voice.oscillator.set('type', synth.waveform));
		}

		// updates envelope of synth voices if changed
		if(prevSynth && checkDifferenceAny(prevSynth.envelope, synth.envelope, ['attack', 'decay', 'sustain', 'release'])) {
			console.log('Updating synth '+synth.id+' envelope');
			Synths[synth.id].forEach(voice => voice.envelope = synth.envelope);
		}
	}
	// TODO: clean up old synth instances -- e.g. if deleted
	
	// init any new effects
	for(let effect of fx) {
		if(!FXs[effect.id] && effect.type in Tone) {
			// const deskEffect = getByKey(desk, effect.id, 'ownerId');
			FXs[effect.id] = new Tone[effect.type](effect.params);
			connectAudioWires(FXs[effect.id], effect.id);
		}
	}

	// init any new LFOs
	for (let lfo of lfos) {
		// ideally multiple LFOs need to created for each mapping, similar to synth 'voices'
		// reason being .. fx params have different min/max requirements and i don't know how to map an LFO to multiple scales
		if(!LFOs[lfo.id]) {
			// shipped off to another function because unlike synths LFOs also have to be inited on app load
			createLfo(lfo);
		}

		const prevLfo = getByKey(oldLfos, lfo.id);
		if(prevLfo) {
			if(lfo.waveform != prevLfo.waveform) {
				// LFOs[lfo.id].set('type', lfo.waveform);
				LFOs[lfo.id].type = lfo.waveform;
			}

			if((lfo.freqNote && !prevLfo.freqNote) || (lfo.freqNote && prevLfo.freqNote && lfo.freqNote != prevLfo.freqNote)) {
				console.log('LFO '+lfo.id+' syncing to transport')
				LFOs[lfo.id].frequency.value = lfo.freqNote;
				LFOs[lfo.id].sync().start(0);
			}else if(!lfo.freqNote && prevLfo.freqNote) {
				console.log('LFO '+lfo.id+' unsyncing from transport')
				LFOs[lfo.id].unsync();
			}

			if(lfo.frequency != prevLfo.frequency) {
				console.log('LFO changed frequency: '+lfo.frequency);
				LFOs[lfo.id].frequency.value = lfo.frequency;
			}
		}
	}
	// TODO: clean up old LFO instances -- e.g. if deleted

	// checks all connections and rewires if needed
	for(let deskItem of desk) {
		const prevDeskItem = getByKey(oldDesk, deskItem.id);

		// check if desk item has audio output capabilities and that its audio outputs have changed
		if(deskItem.audioOutput) {
			if(prevDeskItem && !_isEqual(Object.keys(prevDeskItem.audioOutputs), Object.keys(deskItem.audioOutputs))) {

				// the difference between synth and fx is that we can have multiple synths (voices) per 'synth'
				// so they must be iterated over, whereas an fx is just a single 'voice'
				if(deskItem.type == DeskItemTypes.FX) {
					console.log('Updating fx '+deskItem.ownerId+' output connections');
					connectAudioWires(FXs[deskItem.ownerId], deskItem.ownerId, true);	
				}else if(deskItem.type == DeskItemTypes.SYNTH) {
					console.log('Updating synth '+deskItem.ownerId+' output connections');
					Synths[deskItem.ownerId].forEach(synth => connectAudioWires(synth, deskItem.ownerId, true));
				}
				
			}
		}

		// check if desk item has data output capabilities and that its data outputs have changed
		if(deskItem.dataOutput) {
			if(prevDeskItem && !_isEqual(Object.keys(prevDeskItem.dataOutputs), Object.keys(deskItem.dataOutputs))) {
				console.log('Updating LFO '+deskItem.ownerId+' output connections', deskItem.dataOutputs);
				connectDataWires(LFOs[deskItem.ownerId], deskItem.ownerId, true)
			}
		}
	}

	oldFXs = _cloneDeep(fx);
	oldLfos = _cloneDeep(lfos);
	oldDesk = _cloneDeep(desk);
	oldSynths = _cloneDeep(synths);
}

export function createLfo(lfo) {
	const { id, frequency, freqNote, min, max, waveform } = lfo;
	LFOs[id] = new LFO(frequency, min, max);
	LFOs[id].type = waveform;
	
	if(freqNote) {
		// ToneJS has a sync functionality so we leverage that
		// "Sync the start/stop/pause to the transport and the frequency to the bpm of the transport"
		LFOs[id].frequency.value = freqNote;
		LFOs[id].sync().start(0);
	}else{
		// I don't like this. It should start based on the offset of transport position % frequency or something ..
		// but for non-synced lfos it shouldn't matter a great deal as they're mostly going to be out of time anyway
		LFOs[id].start(0);
	}

	return LFOs[id];
}

export function initFx() {
	const { fx, desk } = store.getState();
	for(let effect of fx) {
		if(effect.type in Tone) {
			// const deskEffect = getByKey(desk, effect.id, 'ownerId');
			FXs[effect.id] = new Tone[effect.type](effect.params);
			connectAudioWires(FXs[effect.id], effect.id);
		}else{
			console.warn('Unknown Effect: '+effect.type);
		}
	}
}

export function initLfos() {
	const { lfos, desk } = store.getState();
	for(let lfo of lfos) {
		// const deskLfo = getByKey(desk, lfo.id, 'ownerId');
		createLfo(lfo);
		connectDataWires(LFOs[lfo.id], lfo.id)
	}
}

export function connectAllWires() {

}

export function connectAudioWires(source, id, disconnectFirst = false) {
	if(!source) console.warn('no audio source to connect from', source, id, FXs);
	if(!source || !id) return;
	
	const { desk } = store.getState();
	const deskItem = getByKey(desk, id, 'ownerId');
	if(!deskItem) return;

	const connections = [];
	const fxKeys = Object.keys(FXs);
	Object.keys(deskItem.audioOutputs).forEach(connectToId => {
		if(connectToId == 'master') {
			connections.push(Tone.Master);
		}else{
			if(fxKeys.indexOf(connectToId) >= 0) {
				connections.push(FXs[connectToId]);
			}
			// todo: buses
		}
	});
	
	if(disconnectFirst) source.disconnect();
	if(connections.length) {
		console.log('Connecting sound source '+id+' to', connections);
		source.fan.apply(source, connections);
	}
}

export function connectDataWires(source, id, disconnectFirst = false) {
	if(!source) console.warn('no data source to connect from', source, id, FXs);
	if(!source || !id) return;
	
	const { desk } = store.getState();
	const deskItem = getByKey(desk, id, 'ownerId');
	if(!deskItem) return;

	const connections = [];
	const fxKeys = Object.keys(FXs);
	Object.keys(deskItem.dataOutputs).forEach(connectToId => {
		if(fxKeys.indexOf(connectToId) >= 0) {
			const inputParam = deskItem.dataOutputs[connectToId].inputParam;
			if(inputParam.key in FXs[connectToId]) {
				const connection = FXs[connectToId][inputParam.key];
				if(connection instanceof Tone.Signal) {
					connections.push(connection);
				}else{
					console.warn('Param key '+inputParam.key+' for '+connectToId+' is not an instance of Tone.Signal. No way to map LFOs to non-signal generators at the moment :(');
				}
			}else{
				console.warn('Couldn\'t find param '+inputParam.key+' in FX '+connectToId);
			}
		}
	});

	if(connections.length) {
		console.log('Connecting data source '+id+' to', connections);
		connections.forEach(connection => source.connect(connection));
	}
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