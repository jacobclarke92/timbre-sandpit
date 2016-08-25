import * as ActionTypes from '../constants/actionTypes'
import { nodeTypeLookup, ARC_NODE, POINT_NODE, ORIGIN_RING_NODE, ORIGIN_RADAR_NODE } from '../constants/nodeTypes'
import * as NoteTypes from '../constants/noteTypes'

const initialState = {
	originRingNodes: [],
	originRadarNodes: [],
	pointNodes: [],
	arcNodes: [],
};

export default function (state = initialState, action) {
	let key = null;
	switch(action.type) {
		case ActionTypes.ADD_NODE:
			key = nodeTypeLookup[action.nodeType];
			return {
				...state,
				[key]: [...state[key], action.node],
			}

		case ActionTypes.REMOVE_NODE:
			key = nodeTypeLookup[action.nodeType];
			return {
				...state,
				[key]: state[key].filter(node => node.id != action.id),
			}

		case ActionTypes.UPDATE_NODE:
			key = nodeTypeLookup[action.nodeType];
			return {
				...state,
				[key]: state[key].map(node => node.id == action.node.id ? action.node : node),
			}
	}
	return state;
}

const defaultNodeAttrs = {
	position: {x: 0, y: 0},
	scale: 1,
};

const defaultNodes = {
	[ARC_NODE]: {...defaultNodeAttrs, circ: Math.PI/2, angle: 0, noteType: NoteTypes.RANDOM},
	[POINT_NODE]: {...defaultNodeAttrs, radius: 4, noteType: NoteTypes.RANDOM},
	[ORIGIN_RING_NODE]: {...defaultNodeAttrs, bars: 4},
	[ORIGIN_RADAR_NODE]: {...defaultNodeAttrs, bars: 4},
};

export function createNode(nodeType, nodeAttrs = {}) {
	const node = {...defaultNodes[nodeType], ...nodeAttrs, nodeType};
	console.log('Adding', nodeType, nodeAttrs);
	return {type: ActionTypes.ADD_NODE, nodeType, node};
}

export function removeNode(nodeType, id) {
	return {type: ActionTypes.REMOVE_NODE, nodeType, id};
}

export function updateNode(nodeType, node) {
	return {type: ActionTypes.UPDATE_NODE, nodeType, node};
}