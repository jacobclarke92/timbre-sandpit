import localStore from 'store'
import * as ActionTypes from '../constants/actionTypes'
import * as WaveTypes from '../constants/waveTypes'
import newId from '../utils/newId'

const initialState = [
	{id: 'init_osc1', frequency: 1, min: 0, max: 1, amplitude: 1, freqNote: null, waveform: WaveTypes.SINE},
	{id: 'init_osc2', frequency: 1, min: 0, max: 1, amplitude: 1, freqNote: null, waveform: WaveTypes.TRIANGLE},
	{id: 'init_osc3', frequency: 1, min: 0, max: 1, amplitude: 1, freqNote: null, waveform: WaveTypes.SAWTOOTH},
	{id: 'init_osc4', frequency: 1, min: 0, max: 1, amplitude: 1, freqNote: null, waveform: WaveTypes.SQUARE},
];

export default function (state = localStore.get('lfos') || initialState, action) {
	switch(action.type) {
		case ActionTypes.ADD_LFO:
			return [...state, action.lfo];

		case ActionTypes.REMOVE_LFO:
			return state.filter(lfo => lfo.id != action.id);

		case ActionTypes.UPDATE_LFO:
			return state.map(lfo => lfo.id == action.lfo.id ? {...lfo, ...action.lfo} : lfo);

	}
	return state;
}

function createDefaultLfo() {
	return {id: newId(), frequency: 1, min: 0, max: 1, amplitude: 1, waveform: WaveTypes.SINE};
}

export function addLfo(lfo = {}) {
	return {type: ActionTypes.ADD_LFO, lfo: {...createDefaultLfo(), ...lfo}};
}

export function removeLfo(id) {
	return {type: ActionTypes.REMOVE_LFO, id};
}

export function updateLfo(lfo) {
	return {type: ActionTypes.UPDATE_LFO, lfo};
}