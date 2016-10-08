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
	[DeskItemTypes.OSCILLATOR]: {
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
		name: 'Example FX',
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
		type: DeskItemTypes.OSCILLATOR,
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
				if(item.ownerId === action.id) {
					const outputs = {...item[action.wireType+'Outputs']};
					if(action.outputId in outputs) {
						delete outputs[action.outputId];
						return {...item, [action.wireType+'Outputs']: outputs};
					}
				}
				return item;
			})
			break;
	}
	return state;
}

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