import React, { Component } from 'react'
import { connect } from 'react-redux'
import Select from 'react-select'

import icons from '../constants/icons'
import modes from '../constants/modes'
import noteStrings from '../constants/noteStrings'
import * as ActionTypes from '../constants/actionTypes'
import * as NodeTypes from '../constants/nodeTypes'
import * as UiViews from '../constants/uiViews'
import { changeView, changeTool } from '../reducers/gui'

import Icon from './ui/Icon'
import Button from './ui/Button'
import ButtonIcon from './ui/ButtonIcon'
import NumberInput from './ui/NumberInput'
import Tools from './ui/Tools'

const views = [
	{type: UiViews.STAGE, icon: 'stage', label: 'Stage'},
	{type: UiViews.OSCILLATORS, icon: 'waveform', label: 'Oscillators'},
	{type: UiViews.MAPPINGS, icon: 'list', label: 'Mappings'},
	{type: UiViews.FX, icon: 'note', label: 'FX'},
];

const tools = [
	{type: NodeTypes.ORIGIN_RING_NODE, icon: 'ring', label: 'Origin Ring Node'},
	{type: NodeTypes.ORIGIN_RADAR_NODE, icon: 'radial-lines', label: 'Origin Radar Node'},
	{type: NodeTypes.POINT_NODE, icon: 'action-add', label: 'Point Node'},
	{type: NodeTypes.ARC_NODE, icon: 'arc', label: 'Arc Node'},
];

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

	render() {
		const { gui } = this.props;
		const { modeString, scaleString, scale } = this.props.musicality;
		const { playing, bpm } = this.props.transport;
		const ToolUi = Tools[gui.tool] || null;
		return (
			<div className="ui">
				<div className="ui-global">
					<div>
						<ButtonIcon icon={playing ? 'pause' : 'play'} selected={playing} onClick={() => this.handlePlayPause()} />
						{views.map((view, i) => 
							<Button key={i} {...view} selected={gui.view == view.type} onClick={() => this.props.dispatch(changeView(view.type))} />
						)}
					</div>
					<div>
						<NumberInput label="BPM" value={bpm} min={20} max={420} step={0.5} onChange={bpm => this.handleBpmChange(bpm)} />
						<label>
							Mode: 
							<Select value={modeString} onChange={({value}) => this.handleModeChange(value)} clearable={false} options={Object.keys(modes).map(value => ({value, label: value}))} style={{width: 160}} />
						</label>
						<label>
							Scale: 
							<Select value={scaleString} onChange={({value}) => this.handleScaleChange(value)} clearable={false} options={noteStrings.map(value => ({value, label: value}))} style={{width: 60}} />
						</label>
					</div>
				</div>
				<div className="ui-view">
					<div>
						{tools.map((tool, i) => 
							<ButtonIcon key={i} {...tool} selected={gui.tool == tool.type} onClick={() => this.props.dispatch(changeTool(tool.type))} />
						)}
					</div>
				</div>
				<div className="ui-selection">
					{ToolUi && <ToolUi />}
				</div>
				{this.props.showIcons && 
					<div className="ui-icons">
						{Object.keys(icons).map((icon, i) =>
							<span key={i} data-label={icon}><Icon name={icon} size={18} /></span>
						)}
					</div>
				}
			</div>
		)
	}
}

export default connect(({gui, musicality, transport}) => ({gui, musicality, transport}))(TopUI)

