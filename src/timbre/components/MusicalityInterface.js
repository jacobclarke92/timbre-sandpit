import React, { Component } from 'react'
import { connect } from 'react-redux'

import modes from '../constants/modes'
import noteColors from '../constants/noteColors'
import noteStrings from '../constants/noteStrings'
import * as ActionTypes from '../constants/actionTypes'

import Bpm from './Bpm'

class MusicalityInterface extends Component {

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
		const { bpm, modeString, scaleString, scale, octave, notes } = this.props.musicality || {};
		return (
			<div className="ui-left">
				<div>
					<Bpm value={bpm} onChange={bpm => this.handleBpmChange(bpm)} />
					<label>
						Mode: 
						<select value={modeString} onChange={event => this.handleModeChange(event.target.value)}>
							{Object.keys(modes).map(key => 
								<option key={key} value={key}>{key}</option>
							)}
						</select>
					</label>
					<label>
						Scale: 
						<select value={scaleString} onChange={event => this.handleScaleChange(event.target.value)}>
							{noteStrings.map(key => 
								<option key={key} value={key}>{key}</option>
							)}
						</select>
					</label>
				</div>
				<div className="scale-colors">
					{notes.map(note => {
						const noteInScale = (note+scale) % 12;
						const noteColor = noteColors[noteInScale];
						return (
							<div key={note} className="scale-color" style={{backgroundColor: '#'+noteColor.toString(16)}}>
								{noteStrings[noteInScale]}
							</div>
						)
					})}
				</div>
			</div>
		)
	}
}

export default connect(({musicality}) => ({musicality}))(MusicalityInterface)