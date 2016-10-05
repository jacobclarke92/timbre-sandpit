import localStore from 'store'

import newId from '../utils/newId'
import * as ActionTypes from '../constants/actionTypes'
import * as DeskItemTypes from '../constants/deskItemTypes'

const initialState = [
	{
		id: newId(),
		name: 'Master',
		owner_id: 'master',
		type: DeskItemTypes.MASTER,
		input: true,
		output: false,
		position: {
			x: 500,
			y: 0,
		}
	},
	{
		id: newId(),
		name: 'Example Synth',
		owner_id: 'init_synth',
		type: DeskItemTypes.SYNTH,
		input: false,
		output: true,
		output_ids: ['init_fx'],
		position: {
			x: 0,
			y: 0,
		},
	},
	{
		id: newId(),
		name: 'Example FX',
		owner_id: 'init_fx',
		type: DeskItemTypes.FX,
		input: true,
		output: true,
		output_ids: ['master'],
		position: {
			x: 250,
			y: 0,
		},
	},
];

export default function(state = localStore.get('desk') || initialState, action) {
	switch(action.type) {
		case ActionTypes.DESK_ITEM_RENAME:
			return state.map(item => item.id == action.id ? {...item, name: action.name} : item);
			break;

		case ActionTypes.DESK_ITEM_MOVE:
			return state.map(item => item.id == action.id ? {...item, position: action.position} : item);
			break;
	}
	return state;
}