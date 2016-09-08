import localStore from 'store'
import * as ActionTypes from '../constants/actionTypes'
import * as WaveTypes from '../constants/waveTypes'
import newId from '../utils/newId'

const initialState = [
	{id: newId(), frequency: 1, amplitude: 1, freqNote: null, waveform: WaveTypes.SINE},
	{id: newId(), frequency: 1, amplitude: 1, freqNote: null, waveform: WaveTypes.TRIANGLE},
	{id: newId(), frequency: 1, amplitude: 1, freqNote: null, waveform: WaveTypes.SAWTOOTH},
	{id: newId(), frequency: 1, amplitude: 1, freqNote: null, waveform: WaveTypes.SQUARE},
];

export default function (state = localStore.get('oscillators') || initialState, action) {
	switch(action.type) {
		case ActionTypes.ADD_OSCILLATOR:
			return [...state, action.oscillator];

		case ActionTypes.REMOVE_OSCILLATOR:
			return state.filter(osc => osc.id != action.id);

		case ActionTypes.UPDATE_OSCILLATOR:
			return state.map(osc => osc.id == action.oscillator.id ? {...osc, ...action.oscillator} : osc);

	}
	return state;
}

function createDefaultOscillator() {
	return {id: newId(), frequency: 1, amplitude: 1, waveform: WaveTypes.SINE};
}

export function addOscillator(oscillator = {}) {
	return {type: ActionTypes.ADD_OSCILLATOR, oscillator: {...createDefaultOscillator(), ...oscillator}};
}

export function removeOscillator(id) {
	return {type: ActionTypes.REMOVE_OSCILLATOR, id};
}

export function updateOscillator(oscillator) {
	return {type: ActionTypes.UPDATE_OSCILLATOR, oscillator};
}