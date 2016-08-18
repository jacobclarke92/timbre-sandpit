import * as ActionTypes from '../constants/actionTypes'

export default function(state = true, action) {
	switch(action.type) {
		case ActionTypes.START_ANIMATING: return true;
		case ActionTypes.STOP_ANIMATING: return false;
	}
	return state;
}