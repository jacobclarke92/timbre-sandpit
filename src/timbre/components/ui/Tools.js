import React, { Component } from 'react'
import { connect } from 'react-redux'
import classname from 'classname'

import modes from '../../constants/modes'
import noteColors from '../../constants/noteColors'
import noteStrings from '../../constants/noteStrings'
import * as NodeTypes from '../../constants/nodeTypes'
import { RANDOM, UP, DOWN, NOTE } from '../../constants/noteTypes'
import { changeToolSetting, changeToolSettings } from '../../reducers/gui'

import ButtonIcon from './ButtonIcon'

class PointNodeTools extends Component {
	render() {
		const { dispatch } = this.props;
		const { noteType, noteIndex } = this.props.gui.toolSettings || {};
		const { modeString, scaleString, scale, notes } = this.props.musicality;
		return (
			<div>
				<ButtonIcon icon="random" data-label="Random" selected={noteType == RANDOM} onClick={() => dispatch(changeToolSetting('noteType', RANDOM))} />
				<ButtonIcon icon="arrow-up" data-label="Ascending" selected={noteType == UP} onClick={() => dispatch(changeToolSetting('noteType', UP))} />
				<ButtonIcon icon="arrow-down" data-label="Descending" selected={noteType == DOWN} onClick={() => dispatch(changeToolSetting('noteType', DOWN))} />
				{notes.map(note => {
					const noteInScale = (note+scale) % 12;
					const noteColor = noteColors[noteInScale];
					return (
						<div key={note} 
							className={classname('scale-color', (noteType == NOTE && note == noteIndex) ? 'active' : false)} 
							style={{backgroundColor: '#'+noteColor.toString(16)}}
							onClick={() => dispatch(changeToolSettings({noteType: NOTE, noteIndex: note}))}>
							{noteStrings[noteInScale]}
						</div>
					)
				})}
			</div>
		)
	}
}

export default {
	[NodeTypes.POINT_NODE]: connect(({gui, musicality}) => ({gui, musicality}))(PointNodeTools),
}