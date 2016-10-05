import localStore from 'store'

import newId from '../utils/newId'
import * as ActionTypes from '../constants/actionTypes'
import * as DeskItemTypes from '../constants/deskItemTypes'

const initialState = [
	{
		owner_id: 'master',
		type: DeskItemTypes.MASTER,
		position: {
			x: 500,
			y: 0,
		}
	},
	{
		owner_id: 'init_synth',
		output_id: 'init_fx',
		type: DeskItemTypes.SYNTH,
		position: {
			x: 0,
			y: 0,
		},
	},
	{
		owner_id: 'init_fx',
		output_id: 'master',
		type: DeskItemTypes.FX,
		position: {
			x: 250,
			y: 0,
		},
	},
];

export default function(state = localStore.get('desk') || initialState, action) {
	switch(action.type) {

	}
	return state;
}