import * as ActionTypes from '../constants/actionTypes'
import noteColors from '../constants/noteColors'
import noteStrings from '../constants/noteStrings'
import modes from '../constants/modes'

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
			return Object.assign({}, state, {octave: action.octave});

		case ActionTypes.UPDATE_SCALE:
			return Object.assign({}, state, {scaleString: action.scale, scale: noteStrings.indexOf(action.scale)});

		case ActionTypes.UPDATE_MODE:
			const mode = modes[action.mode];
			return Object.assign({}, state, {modeString: action.mode, mode, notes: mode ? mode.degrees() : []});

		case ActionTypes.UPDATE_BPM:
			return Object.assign({}, state, {bpm: action.bpm});
	}
	return state;
}