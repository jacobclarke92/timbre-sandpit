import React, { Component } from 'react'
import { connect } from 'react-redux'
import classname from 'classname'

import { BEAT_PX } from '../../constants/globals'
import noteColors from '../../constants/noteColors'
import noteStrings from '../../constants/noteStrings'
import * as NodeTypes from '../../constants/nodeTypes'
import * as WaveTypes from '../../constants/waveTypes'
import * as ActionTypes from '../../constants/actionTypes'
import { RANDOM, UP, DOWN, NOTE } from '../../constants/noteTypes'

import { updateNode } from '../../reducers/stage'
import { getByKey } from '../../utils/arrayUtils'

import Select from 'react-select'
import ButtonIcon from './ButtonIcon'
import NumberInput from './NumberInput'
import Envelope from './Envelope'


class PointNodeProperties extends Component {

	updateProperty(key, value) {
		const { activeNode } = this.props.gui;
		if(!activeNode) return;
		const node = {...activeNode, [key]: value};
		this.props.dispatch(updateNode(node.nodeType, node));
	}

	render() {
		const { dispatch } = this.props;
		const { activeNode } = this.props.gui;
		const { modeString, scaleString, scale, notes } = this.props.musicality;
		return (
			<div>
				<ButtonIcon icon="random" data-label="Random" selected={activeNode.noteType == RANDOM} onClick={() => this.updateProperty('noteType', RANDOM)} />
				<ButtonIcon icon="arrow-up" data-label="Ascending" selected={activeNode.noteType == UP} onClick={() => this.updateProperty('noteType', UP)} />
				<ButtonIcon icon="arrow-down" data-label="Descending" selected={activeNode.noteType == DOWN} onClick={() => this.updateProperty('noteType', DOWN)} />
				{notes.map((note, i) => {
					const noteInScale = (note+scale) % 12;
					const noteColor = noteColors[noteInScale];
					return (
						<div key={i} 
							data-numbered={i+1}
							className={classname('scale-color', (activeNode.noteType == NOTE && note == notes[activeNode.noteIndex]) ? 'active' : false)} 
							style={{backgroundColor: '#'+noteColor.toString(16)}}
							onClick={() => dispatch(updateNode(activeNode.nodeType, { ...activeNode, noteType: NOTE, noteIndex: notes.indexOf(note) }))}>
							{noteStrings[noteInScale]}
						</div>
					)
				})}
			</div>
		)
	}
}

class RingNodeProperties extends Component {

	updateProperty(key, value) {
		const { activeNode } = this.props.gui;
		if(!activeNode) return;
		const node = {...activeNode, [key]: value};
		this.props.dispatch(updateNode(node.nodeType, node));
	}

	handleWaveformChange(waveform, synth) {
		this.props.dispatch({type: ActionTypes.UPDATE_SYNTH, synth: {...synth, waveform}});
	}

	render() {
		const { dispatch, gui, synths } = this.props;
		const { activeNode } = gui;
		const synth = getByKey(synths, activeNode.synthId);
		return (
			<div className="properties-container">
				<NumberInput label="Beats" min={2} max={7} value={activeNode.beats} onChange={value => this.updateProperty('beats', value)} style={{width: 80}} />
				<NumberInput label="Bars" min={1} max={8} value={activeNode.bars} onChange={value => this.updateProperty('bars', value)} style={{width: 80}} />
				<NumberInput label="Speed" min={1} max={16} value={activeNode.speed} onChange={value => this.updateProperty('speed', value)} style={{width: 80}} />
				<label>
					Waveform: 
					<Select value={synth.waveform} onChange={({value}) => this.handleWaveformChange(value, synth)} clearable={false} options={Object.keys(WaveTypes).map(label => ({value: WaveTypes[label], label}))} style={{width: 140}} />
				</label>
				<Envelope envelope={synth.envelope} />
			</div>
		)
	}
}


class RadarNodeProperties extends Component {

	updateProperty(key, value) {
		const { activeNode } = this.props.gui;
		if(!activeNode) return;
		const node = {...activeNode, [key]: value};
		this.props.dispatch(updateNode(node.nodeType, node));
	}

	handleWaveformChange(waveform, synth) {
		this.props.dispatch({type: ActionTypes.UPDATE_SYNTH, synth: {...synth, waveform}});
	}

	render() {
		const { dispatch, gui, synths } = this.props;
		const { activeNode } = gui;
		const synth = getByKey(synths, activeNode.synthId);
		return (
			<div className="properties-container">
				<NumberInput label="Beats" min={2} max={7} value={activeNode.beats} onChange={value => this.updateProperty('beats', value)} style={{width: 80}} />
				<NumberInput label="Bars" min={1} max={8} value={activeNode.bars} onChange={value => this.updateProperty('bars', value)} style={{width: 80}} />
				<NumberInput label="Speed" min={1} max={16} value={activeNode.speed} onChange={value => this.updateProperty('speed', value)} style={{width: 80}} />
				<NumberInput label="Radius" min={20} max={20*BEAT_PX} step={BEAT_PX} value={activeNode.radius} onChange={value => this.updateProperty('radius', value)} style={{width: 90}} />
				<label>
					Waveform: 
					<Select value={synth.waveform} onChange={({value}) => this.handleWaveformChange(value, synth)} clearable={false} options={Object.keys(WaveTypes).map(label => ({value: WaveTypes[label], label}))} style={{width: 140}} />
				</label>
				<Envelope envelope={synth.envelope} />
			</div>
		)
	}
}

export default {
	[NodeTypes.POINT_NODE]: connect(({gui, musicality}) => ({gui, musicality}))(PointNodeProperties),
	[NodeTypes.ORIGIN_RING_NODE]: connect(({gui, musicality, synths}) => ({gui, musicality, synths}))(RingNodeProperties),
	[NodeTypes.ORIGIN_RADAR_NODE]: connect(({gui, musicality, synths}) => ({gui, musicality, synths}))(RadarNodeProperties),
}