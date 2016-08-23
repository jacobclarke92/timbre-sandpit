import * as UiViews from '../constants/uiViews'
import * as NodeTypes from '../constants/nodeTypes'
import * as NoteTypes from '../constants/noteTypes'
import * as ActionTypes from '../constants/actionTypes'


const initialToolSettings = {
	[NodeTypes.ORIGIN_RING_NODE]: {},
	[NodeTypes.ORIGIN_RADAR_NODE]: {},
	[NodeTypes.POINT_NODE]: {
		noteType: NoteTypes.RANDOM,
		volume: 0.8,
	},
	[NodeTypes.ARC_NODE]: {
		noteType: NoteTypes.RANDOM,
		volume: 0.8,
	},
};

const initialState = {
	view: UiViews.STAGE,
	tool: NodeTypes.POINT_NODE,
	toolSettings: initialToolSettings[NodeTypes.POINT_NODE],
	_toolSettings: {...initialToolSettings},
};

export default function(state = initialState, action) {
	let toolSettings = {};
	switch(action.type) {
		case ActionTypes.TOOL_CHANGE:
			console.log('Changed tool', action.tool);
			const _toolSettings = {...state._toolSettings, [state.tool]: state.toolSettings};
			toolSettings = state._toolSettings[action.tool];
			return {...state, tool: action.tool, toolSettings, _toolSettings};
		
		case ActionTypes.VIEW_CHANGE:
			console.log('Changed view', action.view);
			return {...state, view: action.view};

		case ActionTypes.TOOL_SETTING_CHANGE:
			toolSettings = {...state.toolSettings, [action.key]: action.value};
			return {...state, toolSettings};

		case ActionTypes.TOOL_SETTINGS_CHANGE:
			toolSettings = state.toolSettings;
			Object.keys(action.settings).forEach(key => {
				toolSettings[key] = action.settings[key];
			});
			return {...state, toolSettings};
	}
	return state;
}

export function changeTool(tool) {
	return {type: ActionTypes.TOOL_CHANGE, tool};
}

export function changeView(view) {
	return {type: ActionTypes.VIEW_CHANGE, view};
}

export function changeToolSetting(key, value) {
	return {type: ActionTypes.TOOL_SETTING_CHANGE, key, value};
}

export function changeToolSettings(settings) {
	console.log(settings);
	return {type: ActionTypes.TOOL_SETTINGS_CHANGE, settings};
}