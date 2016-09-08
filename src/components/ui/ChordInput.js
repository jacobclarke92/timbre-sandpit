import React, { Component } from 'react'
import classname from 'classname'
import Select from 'react-select'

import Button from './Button'
import ButtonIcon from './ButtonIcon'

import noteStrings from '../../constants/noteStrings'
import { triadValues } from '../../constants/hookTheory'

export default class ChordInput extends Component {

	static defaultProps = {
		scale: 0,
		notes: [0,2,4,5,7,9,11],
		value: {numeral: 1, mode: 'major'},
		suggested: false,
		playing: false,
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

	getTriadOptions() {
		const triadKeys = Object.keys(triadValues);
		const triads = triadKeys.map(value => ({value, label: value}));
		triads.unshift({value: null, label: '[None]'});
		return triads;
	}

	handleChange(key, newValue) {
		if(!key) return;
		const value = this.props.value || {};
		value[key] = newValue;
		this.props.onChange(value);
	}

	render() {
		const { value, notes, suggested, playing } = this.props;
		const numeralOptions = this.getChordOptions();
		return (
			<div className={classname('chord-input', suggested && 'suggested', playing && 'playing')}>
				<ButtonIcon icon="play" size="xsmall" selected onClick={this.props.onPlay} />
				<hr className="vertical" />
				<label>
					Numeral: 
					<Select 
						clearable={false} 
						value={numeralOptions[value.numeral-1]} 
						style={{width: 160}}
						options={numeralOptions} 
						onChange={({value}) => this.handleChange('numeral', notes.indexOf(value)+1)} />
				</label>
				<label>
					Triad: 
					<Select
						clearable={false}
						value={value.triad}
						style={{width: 120}}
						options={this.getTriadOptions()}
						onChange={({value}) => this.handleChange('triad', value)} />
				</label>
				<Button label="7" selected={value.seventh} onClick={() => this.handleChange('seventh', !value.seventh)} />
				<hr className="vertical" />
				<ButtonIcon icon="close" size="xsmall" onClick={this.props.onRemove} />
			</div>
		)
	}

}