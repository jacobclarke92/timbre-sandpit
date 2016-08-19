import * as ActionTypes from '../constants/actionTypes'
import noteColors from '../constants/noteColors'
import noteStrings from '../constants/noteStrings'
import modes from '../constants/modes'
import { setBpm } from '../sound'

const initialState = {
	bpm: 128,
	scale: 0,
	scaleString: 'C',
	octave: 4,
	modeString: 'lydian',
	mode: modes['lydian'],
	notes: modes['lydian'].degrees(),
};

export default function (state = initialState, action) {
	switch(action.type) {
		case ActionTypes.UPDATE_OCTAVE:
			return {
				...state, 
				octave: action.octave,
			}

		case ActionTypes.UPDATE_SCALE:
			return {
				...state, 
				scaleString: action.scale, 
				scale: noteStrings.indexOf(action.scale),
			}

		case ActionTypes.UPDATE_MODE:
			const mode = modes[action.mode];
			return {
				...state, 
				modeString: action.mode, mode, 
				notes: mode ? mode.degrees() : [],
			}

		case ActionTypes.UPDATE_BPM:
			setBpm(action.bpm);
			return {
				...state, 
				bpm: action.bpm,
			}
	}
	return state;
}