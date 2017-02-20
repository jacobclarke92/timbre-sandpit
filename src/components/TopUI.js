import React, { Component } from 'react'
import { connect } from 'react-redux'
import Select from 'react-select'

import icons from '../constants/icons'
import modes from '../constants/modes'
import noteStrings from '../constants/noteStrings'
import { modePrefixes } from '../constants/hookTheory'
import * as ActionTypes from '../constants/actionTypes'
import * as NodeTypes from '../constants/nodeTypes'
import * as ToolTypes from '../constants/toolTypes'
import * as UiViews from '../constants/uiViews'
import { changeView, changeTool } from '../reducers/gui'

import Icon from './ui/Icon'
import Button from './ui/Button'
import ButtonIcon from './ui/ButtonIcon'
import NumberInput from './ui/NumberInput'
import BeatIndicator from './ui/BeatIndicator'
import ToolsUI from './ui/ToolsUI'

const hookTheoryModes = Object.keys(modePrefixes);

const views = [
	{type: UiViews.STAGE, icon: 'stage', label: 'Stage'},
	{type: UiViews.CHORDS, icon: 'piano', label: 'Chords'},
	{type: UiViews.LFOS, icon: 'waveform', label: 'LFOs'},
	{type: UiViews.MAPPINGS, icon: 'list', label: 'Matrix'},
	{type: UiViews.DESK, icon: 'note', label: 'Desk'},
];

const tools = {
	[UiViews.STAGE]: [
		{type: NodeTypes.ORIGIN_RING_NODE, icon: 'ring', label: 'Origin Ring Node'},
		{type: NodeTypes.ORIGIN_RADAR_NODE, icon: 'radial-lines', label: 'Origin Radar Node'},
		{type: NodeTypes.POINT_NODE, icon: 'action-add', label: 'Point Node'},
		{type: NodeTypes.ARC_NODE, icon: 'arc', label: 'Arc Node'},
	],
	[UiViews.DESK]: [
		{type: ToolTypes.DESK_EDIT, icon: 'stage', label: 'Desk Edit'},
		{type: ToolTypes.DESK_FX_EDIT, icon: 'waveform', label: 'Effects'},
	],
};

class TopUI extends Component {

	static defaultProps = {
		showIcons: false,
	};

	handlePlayPause() {
		const { playing } = this.props.transport;
		this.props.dispatch({type: playing ? ActionTypes.TRANSPORT_STOP : ActionTypes.TRANSPORT_START});
	}

	handleBpmChange(bpm) {
		this.props.dispatch({type: ActionTypes.UPDATE_BPM, bpm});
	}

	handleModeChange(mode) {
		this.props.dispatch({type: ActionTypes.UPDATE_MODE, mode});
	}

	handleScaleChange(scale) {
		this.props.dispatch({type: ActionTypes.UPDATE_SCALE, scale});
	}

	handleMeterBeatsChange(meterBeats) {
		this.props.dispatch({type: ActionTypes.UPDATE_METER_BEATS, meterBeats});
	}

	handleMeterTimeChange(meterTime) {
		this.props.dispatch({type: ActionTypes.UPDATE_METER_TIME, meterTime});
	}

	getModeOptions() {
		const { chordsEnabled } = this.props.gui;
		let modeStrings = Object.keys(modes);
		if(chordsEnabled) modeStrings = modeStrings.filter(mode => hookTheoryModes.indexOf(mode) >= 0);
		return modeStrings.map(value => ({value, label: value}));
	}

	render() {
		const { gui, dispatch } = this.props;
		const { modeString, scaleString, scale } = this.props.musicality;
		const { playing, bpm, meterBeats, meterTime } = this.props.transport;
		const ToolUI = (ToolsUI[gui.view] && ToolsUI[gui.view][gui.tool]) || null;
		return (
			<div className="ui">
				<div className="ui-global">
					<div>
						<ButtonIcon icon={playing ? 'pause' : 'play'} selected={playing} onClick={() => this.handlePlayPause()} />
						<hr className="vertical" />
						{views.map((view, i) => 
							<Button key={i} {...view} selected={gui.view == view.type} onClick={() => dispatch(changeView(view.type))} />
						)}
					</div>
					<div>
						<NumberInput label="Signature" size="xsmall" value={meterBeats} min={2} max={15} step={1} onChange={meterBeats => this.handleMeterBeatsChange(meterBeats)} style={{width: 30}} /> / 
						<NumberInput label="" size="xsmall" value={meterTime} min={3} max={16} step={1} onChange={meterTime => this.handleMeterTimeChange(meterTime)} style={{width: 30}} />
						<NumberInput label="BPM" size="xsmall" value={bpm} min={20} max={420} step={0.5} onChange={bpm => this.handleBpmChange(bpm)} />
						<label>
							<BeatIndicator />
						</label>
						<label>
							Mode: 
							<Select value={modeString} onChange={({value}) => this.handleModeChange(value)} clearable={false} options={this.getModeOptions()} style={{width: 140}} />
						</label>
						<label>
							Scale: 
							<Select value={scaleString} onChange={({value}) => this.handleScaleChange(value)} clearable={false} options={noteStrings.map(value => ({value, label: value}))} style={{width: 60}} />
						</label>
					</div>
				</div>
				<div className="ui-view">
					<div>
						{(tools[gui.view] || []).map((tool, i) => 
							<ButtonIcon key={i} {...tool} selected={gui.tool == tool.type} onClick={() => dispatch(changeTool(tool.type, gui.view))} />
						)}
						{gui.view == UiViews.STAGE && 
							<span>
								<hr className="vertical" />
								<ButtonIcon icon="radar" label="Hide guides" selected={!gui.showGuides} onClick={() => dispatch({type: gui.showGuides ? ActionTypes.HIDE_GUIDES : ActionTypes.SHOW_GUIDES})} />
								<ButtonIcon icon="snapping" label="Enable snapping" selected={gui.snapping} onClick={() => dispatch({type: gui.snapping ? ActionTypes.DISABLE_SNAPPING : ActionTypes.ENABLE_SNAPPING})} />
							</span>
						}
					</div>
				</div>
				<div className="ui-selection">
					{ToolUI && <ToolUI />}
				</div>
				{this.props.showIcons && 
					<div className="ui-icons">
						{Object.keys(icons).map((icon, i) =>
							<span key={i} data-label={icon}><Icon name={icon} size="small" /></span>
						)}
					</div>
				}
			</div>
		)
	}
}

export default connect(({gui, musicality, transport}) => ({gui, musicality, transport}))(TopUI)

