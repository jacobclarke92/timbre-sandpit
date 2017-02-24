import localStore from 'store'

import newId from '../utils/newId'
import * as ActionTypes from '../constants/actionTypes'
import * as MapTypes from '../constants/mapTypes'

let initialState = [
	/*
	{
		id: newId(),
		mapType: MapTypes.LINEAR,
		inverted: false,
		min: -1,
		max: 1,
		outputOwnerId: 'string',
		inputOwnerId: 'string',
		inputParamKey: 'string',
	}
	 */
];

export default function(state = localStore.get('matrix') || initialState, action) {
	switch(action.type) {
		case ActionTypes.DESK_CONNECT_WIRE:
			if(action.wireType == 'data') {
				return [...state, {
					id: newId(),
					mapType: MapTypes.LINEAR,
					inverted: false,
					min: -1,
					max: 1,
					outputOwnerId: action.output.ownerId,
					inputOwnerId: action.input.ownerId,
					inputParamKey: action.inputParam.key,
				}];
			}
			break;
		case ActionTypes.DESK_DISCONNECT_WIRE:
			if(action.wireType == 'data') {
				return state.filter(item => !(
					item.outputOwnerId == action.outputOwnerId,
					item.inputOwnerId == action.inputOwnerId,
					item.inputParamKey == action.inputParamKey
				));
			}
			break;
	}
	return state;
}