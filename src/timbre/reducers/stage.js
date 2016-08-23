import * as ActionTypes from '../constants/actionTypes'
import * as NodeTypes from '../constants/nodeTypes'
import * as NoteTypes from '../constants/noteTypes'

const initialState = {
	originRingNodes: [],
	originRadarNodes: [],
	pointNodes: [],
	arcNodes: [],
};

export default function (state = initialState, action) {
	switch(action.type) {
		case ActionTypes.ADD_RING_NODE:
			return {
				...state,
				originRingNodes: [...state.originRingNodes, action.node]
			}
		case ActionTypes.REMOVE_RING_NODE:
			return {
				...state,
				originRingNodes: state.originRingNodes.filter(node => node.id != action.id),
			}
		case ActionTypes.ADD_RADAR_NODE:
			return {
				...state,
				originRadarNodes: [...state.originRadarNodes, action.node]
			}
		case ActionTypes.REMOVE_RADAR_NODE:
			return {
				...state,
				originRadarNodes: state.originRadarNodes.filter(node => node.id != action.id),
			}
		case ActionTypes.ADD_POINT_NODE:
			return {
				...state,
				pointNodes: [...state.pointNodes, action.node]
			}
		case ActionTypes.REMOVE_POINT_NODE:
			return {
				...state,
				pointNodes: state.pointNodes.filter(node => node.id != action.id),
			}
		case ActionTypes.ADD_ARC_NODE:
			return {
				...state,
				arcNodes: [...state.arcNodes, action.node]
			}
		case ActionTypes.REMOVE_ARC_NODE:
			return {
				...state,
				arcNodes: state.arcNodes.filter(node => node.id != action.id),
			}
	}
	return state;
}

const defaultNodeAttrs = {
	position: {x: 0, y: 0},
	scale: 1,
	radius: 4,
	noteType: NoteTypes.RANDOM,
};

export function createNode(nodeType, nodeAttrs = {}) {
	const node = {...defaultNodeAttrs, ...nodeAttrs, nodeType};
	console.log('Adding', nodeType);
	switch(nodeType) {
		case NodeTypes.ORIGIN_RING_NODE:
			return {type: ActionTypes.ADD_RING_NODE, node}; break;

		case NodeTypes.ORIGIN_RADAR_NODE:
			return {type: ActionTypes.ADD_RADAR_NODE, node}; break;

		case NodeTypes.POINT_NODE:
			return {type: ActionTypes.ADD_POINT_NODE, node}; break;

		case NodeTypes.ARC_NODE:
			return {type: ActionTypes.ADD_ARC_NODE, node}; break;
	}
}

export function removeNode(nodeType, id) {
	switch(nodeType) {
		case NodeTypes.ORIGIN_RING_NODE:
			return {type: ActionTypes.REMOVE_RING_NODE, id}; break;

		case NodeTypes.ORIGIN_RADAR_NODE:
			return {type: ActionTypes.REMOVE_RADAR_NODE, id}; break;

		case NodeTypes.POINT_NODE:
			return {type: ActionTypes.REMOVE_POINT_NODE, id}; break;

		case NodeTypes.ARC_NODE:
			return {type: ActionTypes.REMOVE_ARC_NODE, id}; break;
	}
}