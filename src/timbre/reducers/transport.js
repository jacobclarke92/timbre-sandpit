import localStore from 'store'
import { Transport } from 'tone'
import * as ActionTypes from '../constants/actionTypes'

const initialState = {
	bpm: 128,
	meterBeats: 4,
	meterTime: 4,
	playing: false,
	startTime: Date.now(),
};

export default function(state = localStore.get('transport') || initialState, action) {
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
				startTime: Date.now(),
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

		case ActionTypes.UPDATE_METER_BEATS:
			setTimeSignature(action.meterBeats, state.meterTime);
			return {
				...state,
				meterBeats: action.meterBeats,
			}

		case ActionTypes.UPDATE_METER_TIME:
			setTimeSignature(state.meterBeats, action.meterTime);
			return {
				...state,
				meterTime: action.meterTime,
			}
	}
	return state;
}

export function setTimeSignature(numerator, denominator) {
	Transport.timeSignature = [numerator, denominator];
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