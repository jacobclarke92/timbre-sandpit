import React, { Component } from 'react'
import { connect } from 'react-redux'

import { DISABLE_CHORDS, ENABLE_CHORDS, ADD_SECTION } from '../constants/actionTypes'

import Button from './ui/Button'
import SectionGenerator from './ui/SectionGenerator'
import { modalHandler } from './ModalHost'

class ChordsInterface extends Component {

	handleSectionEdit(isNew = false, section = {chords: [], loops: 0}) {
		modalHandler.add({
			Component: SectionGenerator,
			props: {
				isNew,
				section,
				onSave: section => this.props.dispatch({type: ADD_SECTION, section}),
			},
		})
	}

	render() {
		const { chordsEnabled } = this.props.gui;
		return (
			<div className="chords-interface">
				<Button 
					icon="piano"
					selected={chordsEnabled} 
					label={'Chords '+(chordsEnabled ? 'Enabled' : 'Disabled')} 
					onClick={() => this.props.dispatch({type: chordsEnabled ? DISABLE_CHORDS : ENABLE_CHORDS})} />

				<Button label="Add Section" onClick={() => this.handleSectionEdit(true)} />

				
			</div>
		)
	}

}

export default connect(({gui}) => ({gui}))(ChordsInterface)