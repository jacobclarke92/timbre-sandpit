import React, { Component } from 'react'
import { connect } from 'react-redux'

import newId from '../utils/newId'
import { DISABLE_CHORDS, ENABLE_CHORDS, ADD_SECTION, UPDATE_SECTION } from '../constants/actionTypes'

import Button from './ui/Button'
import Section from './ui/Section'
import SectionGenerator from './ui/SectionGenerator'
import { modalHandler } from './ModalHost'

class ChordsInterface extends Component {

	handleSectionEdit(isNew = false, section = null) {
		if(!section) section = {id: newId(), chords: [], loops: 0};
		modalHandler.add({
			Component: SectionGenerator,
			props: {
				isNew,
				section,
				onSave: section => this.props.dispatch({type: isNew ? ADD_SECTION : UPDATE_SECTION, section}),
			},
		})
	}

	render() {
		const { chordsEnabled } = this.props.gui;
		const { sections, scale, modeString } = this.props.musicality;
		return (
			<div className="chords-interface">
				<div className="chords-interface-header">
					<Button 
						icon="piano"
						selected={chordsEnabled} 
						label={'Chords '+(chordsEnabled ? 'Enabled' : 'Disabled')} 
						onClick={() => this.props.dispatch({type: chordsEnabled ? DISABLE_CHORDS : ENABLE_CHORDS})} />
				</div>
				<div className="chords-interface-body">
					<div className="sections">
						{sections.map((section, i) => 
							<Section key={i} section={section} scale={scale} mode={modeString} onClick={() => this.handleSectionEdit(false, section)} />
						)}
					</div>
					<Button label="Add Section" onClick={() => this.handleSectionEdit(true)} />
				</div>
				
			</div>
		)
	}

}

export default connect(({gui, musicality}) => ({gui, musicality}))(ChordsInterface)