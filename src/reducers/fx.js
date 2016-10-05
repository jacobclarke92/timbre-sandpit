import localStore from 'store'

import newId from '../utils/newId'
import * as ActionTypes from '../constants/actionTypes'
import FX from '../constants/fx'

const fxKeys = Object.keys(FX);

const initialState = [{
	id: 'init_fx',
	type: 'Freeverb',
	params: FX.Freeverb.params.reduce((current, param) => ({...current, [param.key]: param.defaultValue}), {}),
}];

export default function(state = localStore.get('fx') || initialState, action) {
	switch(action.type) {

	}
	return state;
}