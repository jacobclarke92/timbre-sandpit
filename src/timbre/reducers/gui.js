import * as UiViews from '../constants/uiViews'
import * as NodeTypes from '../constants/nodeTypes'
import * as ActionTypes from '../constants/actionTypes'

const initialState = {
	view: UiViews.STAGE,
	tool: NodeTypes.STANDARD_NODE,
}

export default function(state = initialState, action) {
	switch(action.type) {
		case ActionTypes.TOOL_CHANGE:
			console.log('Changed tool', action.tool);
			return {...state, tool: action.tool};
		case ActionTypes.VIEW_CHANGE:
			console.log('Changed view', action.view);
			return {...state, view: action.view};
	}
	return state;
}

export function changeTool(tool) {
	return {type: ActionTypes.TOOL_CHANGE, tool};
}

export function changeView(view) {
	return {type: ActionTypes.VIEW_CHANGE, view};
}