import { Transport } from 'tone'

import newId from '../utils/newId'
import * as ActionTypes from '../constants/actionTypes'
import * as WaveTypes from '../constants/waveTypes'

const initialState = [{
	id: newId(),
	waveform: WaveTypes.SINE,
	envelope: {
		attack: 0.1,
		decay: 1,
		sustain: 0,
		release: 1,
	},
}];

export default function(state = initialState, action) {
	switch(action.type) {

		case ActionTypes.ADD_SYNTH:
			break;

	}
	return state;
}