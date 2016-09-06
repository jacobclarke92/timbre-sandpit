import React, { Component } from 'react'
import Select from 'react-select'

import noteStrings from '../../constants/noteStrings'

export default class ChordSelect extends Component {

	static defaultProps = {
		scale: 0,
		value: 0,
		notes: [0,2,4,5,7,9,11],
		label: 'Chord',
	};

	getChordOptions() {
		const { notes, scale } = this.props;
		const chords = [];
		for(let i = 0; i < notes.length; i ++) {
			const note = (notes[i] + scale) % 12;
			chords.push({value: notes[i], label: (i+1)+' ('+noteStrings[note]+')'});
		}
		return chords;
	}

	render() {
		return (
			<label>
				{this.props.label}: 
				<Select value={this.props.value} onChange={({value}) => this.props.onChange(value)} clearable={false} options={this.getChordOptions()} style={{width: 160}} />
			</label>
		)
	}

}