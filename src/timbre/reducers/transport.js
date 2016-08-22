import { Transport } from 'tone'
import * as ActionTypes from '../constants/actionTypes'

const initialState = {
	bpm: 128,
	playing: true,
};

export default function(state = initialState, action) {
	switch(action.type) {

		case ActionTypes.UPDATE_BPM:
			setBpm(action.bpm);
			return {
				...state, 
				bpm: action.bpm,
			}
		case ActionTypes.TRANSPORT_START: 
			startTransport();
			return {
				...state,
				playing: true,
			}
		case ActionTypes.TRANSPORT_STOP: 
			stopTransport();
			return {
				...state,
				playing: false,
			}
		case ActionTypes.TRANSPORT_TOGGLE:
			const playing = !state.playing;
			if(playing) startTransport();
			else stopTransport();
			return {...state, playing};
	}
	return state;
}

export function setBpm(bpm) {
	console.log('Updaing transport bpm', bpm);
	Transport.bpm.value = bpm;
}

export function startTransport() {
	Transport.start();
}

export function stopTransport() {
	Transport.stop();
}