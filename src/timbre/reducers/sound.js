import * as ActionTypes from '../constants/actionTypes'

const initialState = {
	waveform: 'sine',
}

export default function(state = initialState, action) {
	switch(action.type) {
		case ActionTypes.UPDATE_WAVEFORM:
			return {...state, waveform: action.waveform};
	}
	return state;
}