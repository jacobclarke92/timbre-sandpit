import * as ActionTypes from '../constants/actionTypes'

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
				originRingNodes: state.originRingNodes.filter(node => node.id != action.node.id),
			}
		case ActionTypes.ADD_RADAR_NODE:
			return {
				...state,
				originRadarNodes: [...state.originRadarNodes, action.node]
			}
		case ActionTypes.REMOVE_RADAR_NODE:
			return {
				...state,
				originRadarNodes: state.originRadarNodes.filter(node => node.id != action.node.id),
			}
		case ActionTypes.ADD_POINT_NODE:
			return {
				...state,
				pointNodes: [...state.pointNodes, action.node]
			}
		case ActionTypes.REMOVE_POINT_NODE:
			return {
				...state,
				pointNodes: state.pointNodes.filter(node => node.id != action.node.id),
			}
		case ActionTypes.ADD_ARC_NODE:
			return {
				...state,
				arcNodes: [...state.arcNodes, action.node]
			}
		case ActionTypes.REMOVE_ARC_NODE:
			return {
				...state,
				arcNodes: state.arcNodes.filter(node => node.id != action.node.id),
			}
	}
	return state;
}