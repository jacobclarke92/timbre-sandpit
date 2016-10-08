import localStore from 'store'

import newId from '../utils/newId'
import * as ActionTypes from '../constants/actionTypes'
import FX from '../constants/fx'

const fxKeys = Object.keys(FX);
const getDefaultValues = type => FX[type].params.reduce((current, param) => ({...current, [param.key]: param.defaultValue}), {});

const initialState = [{
	id: 'init_fx',
	type: 'Freeverb',
	params: getDefaultValues('Freeverb'),
}];

export default function(state = localStore.get('fx') || initialState, action) {
	switch(action.type) {
		case ActionTypes.ADD_FX:
			return [...state, {id: action.id, type: action.fxType, params: getDefaultValues(action.fxType)}];
			break;
		case ActionTypes.REMOVE_FX:
			return state.filter(item => item.id !== action.id);
			break;
	}
	return state;
}