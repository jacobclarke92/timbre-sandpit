import * as ActionTypes from '../constants/actionTypes'

const initialState = {
	attack: 0.1,
	sustain: 0,
	decay: 1,
	release: 1,
	max: 5,
}

export default function(state = initialState, action) {
	switch(action.type) {
		case ActionTypes.UPDATE_ENVELOPE:
			return {...state, [action.node]: action.value};
	}
	return state;
}