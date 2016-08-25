import React, { Component } from 'react'
import { connect } from 'react-redux'
import classname from 'classname'

import noteColors from '../../constants/noteColors'
import noteStrings from '../../constants/noteStrings'
import * as NodeTypes from '../../constants/nodeTypes'
import { RANDOM, UP, DOWN, NOTE } from '../../constants/noteTypes'

import ButtonIcon from './ButtonIcon'

class PointNodeProperties extends Component {
	render() {
		const { dispatch } = this.props;
		const { activeNode } = this.props.gui;
		const { modeString, scaleString, scale, notes } = this.props.musicality;
		return (
			<div>
				<ButtonIcon icon="random" data-label="Random" selected={activeNode.noteType == RANDOM} onClick={() => dispatch(changeToolSetting('noteType', RANDOM))} />
				<ButtonIcon icon="arrow-up" data-label="Ascending" selected={activeNode.noteType == UP} onClick={() => dispatch(changeToolSetting('noteType', UP))} />
				<ButtonIcon icon="arrow-down" data-label="Descending" selected={activeNode.noteType == DOWN} onClick={() => dispatch(changeToolSetting('noteType', DOWN))} />
				{notes.map((note, i) => {
					const noteInScale = (note+scale) % 12;
					const noteColor = noteColors[noteInScale];
					return (
						<div key={i} 
							data-numbered={i+1}
							className={classname('scale-color', (activeNode.noteType == NOTE && note == notes[activeNode.noteIndex]) ? 'active' : false)} 
							style={{backgroundColor: '#'+noteColor.toString(16)}}
							onClick={() => dispatch(changeToolSettings({noteType: NOTE, noteIndex: notes.indexOf(note)}))}>
							{noteStrings[noteInScale]}
						</div>
					)
				})}
			</div>
		)
	}
}

export default {
	[NodeTypes.POINT_NODE]: connect(({gui, musicality}) => ({gui, musicality}))(PointNodeProperties),
}