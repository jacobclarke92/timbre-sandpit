import localStore from 'store'

import newId from '../utils/newId'
import * as ActionTypes from '../constants/actionTypes'
import * as DeskItemTypes from '../constants/deskItemTypes'

const defaultDeskItems = {
	[DeskItemTypes.MASTER]: {
		audioInput: true,
		audioOutput: false,
		dataInput: false,
		dataOutput: false,
	},
	[DeskItemTypes.BUS]: {
		audioInput: true,
		audioOutput: true,
		audioOutputs: {},
		dataInput: false,
		dataOutput: false,
	},
	[DeskItemTypes.SYNTH]: {
		audioInput: false,
		audioOutput: true,
		audioOutputs: {},
		dataInput: true,
		dataOutput: false,
	},
	[DeskItemTypes.FX]: {
		audioInput: true,
		audioOutput: true,
		audioOutputs: {},
		dataInput: true,
		dataOutput: false,
	},
	[DeskItemTypes.LFO]: {
		audioInput: false,
		audioOutput: false,
		dataInput: false,
		dataOutput: true,
		dataOutputs: {},
	},
}

let initialState = [
	{
		id: newId(),
		name: 'Master',
		ownerId: 'master',
		type: DeskItemTypes.MASTER,
		position: {
			x: 500,
			y: 0,
		}
	},
	{
		id: newId(),
		name: 'Example Synth',
		ownerId: 'init_synth',
		type: DeskItemTypes.SYNTH,
		audioOutputs: {init_fx: {outputPosition: {x: 200, y: 100}, inputPosition: {x: 0, y: 100}}},
		position: {
			x: 0,
			y: 0,
		},
	},
	{
		id: newId(),
		name: 'Freeverb',
		ownerId: 'init_fx',
		type: DeskItemTypes.FX,
		audioOutputs: {master: {outputPosition: {x: 200, y: 100}, inputPosition: {x: 0, y: 100}}},
		position: {
			x: 250,
			y: 0,
		},
	},
];
for(let i=1; i<5; i++) {
	initialState.push({
		id: newId(),
		name: 'Example OSC '+i,
		ownerId: 'init_osc'+i,
		type: DeskItemTypes.LFO,
		position: {
			x: 250*(i-1),
			y: 300,
		}
	});
}

// object assign default desk item (lookup by type) to initial state desk items
initialState = initialState.map(item => ({...defaultDeskItems[item.type], ...item}));

export default function(state = localStore.get('desk') || initialState, action) {
	switch(action.type) {
		case ActionTypes.DESK_ITEM_RENAME:
			return state.map(item => item.id == action.id ? {...item, name: action.name} : item);
			break;

		case ActionTypes.DESK_ITEM_MOVE:
			return state.map(item => item.id == action.id ? {...item, position: action.position} : item);
			break;

		case ActionTypes.DESK_CONNECT_WIRE:
			console.log(action);
			return state.map(item => {
				if(item.ownerId === action.output.ownerId) {
					const outputs = item[action.wireType+'Outputs'];
					if(Object.keys(outputs).indexOf(action.input.ownerId) < 0) {
						// there was some issue with mutability so i just return a new object
						return {
							...item, 
							[action.wireType+'Outputs']: {
								...outputs, 
								[action.input.ownerId]: {
									inputParam: action.inputParam,
									outputPosition: action.outputPosition, 
									inputPosition: action.inputPosition
								}
							}
						}
					}
				}
				return item;
			});
			break;

		case ActionTypes.DESK_DISCONNECT_WIRE:
			return state.map(item => {
				if(item.ownerId === action.outputOwnerId) {
					const outputs = {...item[action.wireType+'Outputs']};
					if(action.inputOwnerId in outputs) {
						delete outputs[action.inputOwnerId];
						return {...item, [action.wireType+'Outputs']: outputs};
					}
				}
				return item;
			})
			break;

		case ActionTypes.ADD_FX:
			return [...state, {
				id: newId(),
				name: action.fxType,
				ownerId: action.id,
				type: DeskItemTypes.FX,
				position: action.position,
				...defaultDeskItems[DeskItemTypes.FX],
			}]
			break;

		case ActionTypes.REMOVE_FX:
		case ActionTypes.REMOVE_SYNTH:
		case ActionTypes.REMOVE_LFO:
			return state.filter(item => item.ownerId != action.id).map(item => {
				if(item.audioOutput && action.id in item.audioOutputs) {
					const audioOutputs = {...item.audioOutputs};
					delete audioOutputs[action.id];
					return {...item, audioOutputs};
				}
				if(item.dataOutput && action.id in item.dataOutputs) {
					const dataOutputs = {...item.dataOutputs};
					delete dataOutputs[action.id];
					return {...item, dataOutputs};
				}
				return item;
			});
			break;

	}
	return state;
}

/**
 * @param  {String} wireType 	- either 'audio' or 'data'
 * @param  {Object} output 		- reference to item in desk store
 * @param  {Object} input 		- reference to item in desk store
 * @param  {PIXI} outputNode 	- reference to PIXI DeskItem wire 'node'
 * @param  {PIXI} inputNode		- reference to PIXI DeskItem wire 'node'
 * @return {Object} 			Returns reducer action
 */
export function connectWire(wireType, output, input, outputNode, inputNode) {
	return {
		type: ActionTypes.DESK_CONNECT_WIRE, 
		output, 
		input, 
		wireType,
		outputPosition: outputNode.position,
		inputPosition: inputNode.position,
		inputParam: inputNode.param || null,
	}
}