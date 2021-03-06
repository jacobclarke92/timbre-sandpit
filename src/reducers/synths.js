import localStore from 'store'
import { Transport } from 'tone'

import newId from '../utils/newId'
import * as ActionTypes from '../constants/actionTypes'
import * as WaveTypes from '../constants/waveTypes'

const initialState = [{
	id: 'init_synth',
	waveform: WaveTypes.SINE,
	envelope: {
		attack: 0.1,
		decay: 1,
		sustain: 0,
		release: 1,
	},
}];

export default function(state = localStore.get('synths') || initialState, action) {
	switch(action.type) {

		case ActionTypes.ADD_SYNTH:
			return [...state, action.synth];
			break;

		case ActionTypes.UPDATE_SYNTH:
			return state.map(synth => synth.id == action.synth.id ? action.synth : synth);
			break;

	}
	return state;
}