import localStore from 'store'
import * as ActionTypes from '../constants/actionTypes'
import noteColors from '../constants/noteColors'
import noteStrings from '../constants/noteStrings'
import modes from '../constants/modes'
import { modePrefixes } from '../constants/hookTheory'

const hookTheoryModes = Object.keys(modePrefixes);

const initialState = {
	scale: 0,
	scaleString: 'C',
	octave: 4,
	modeString: 'lydian',
	notes: modes['lydian'].degrees(),
	chords: [],
};

export default function (state = localStore.get('musicality') || initialState, action) {
	switch(action.type) {
		case ActionTypes.UPDATE_OCTAVE:
			return {
				...state, 
				octave: action.octave,
			}

		case ActionTypes.UPDATE_SCALE:
			// console.log('Scale changed', action.scale, noteStrings[action.scale]);
			return {
				...state, 
				scaleString: action.scale, 
				scale: noteStrings.indexOf(action.scale),
			}

		case ActionTypes.UPDATE_MODE:
			// console.log('Mode changed', action.mode);
			const mode = modes[action.mode];
			return {
				...state, 
				modeString: action.mode, mode, 
				notes: mode ? mode.degrees() : [],
			}

		case ActionTypes.UPDATE_CHORDS:
			return {
				...state,
				chords: action.chords,
			}

		case ActionTypes.ENABLE_CHORDS:
			if(hookTheoryModes.indexOf(state.modeString) < 0) {
				return {
					...state,
					modeString: 'major',
					notes: modes['major'].degrees(),
				}
			}

	}
	return state;
}