import React, { Component, PropTypes } from 'react'
import Select from 'react-select'

import timeSyntax from '../../constants/timeSyntax'
import { SINE, SQUARE, TRIANGLE, SAWTOOTH } from '../../constants/waveTypes'
import OscillatorDisplay from './OscillatorDisplay'
import NumberInput from './NumberInput'
import Icon from './Icon'
import Button from './Button'
import ButtonIcon from './ButtonIcon'

const waveforms = [SINE, SQUARE, TRIANGLE, SAWTOOTH].map(value => ({value, label: value}));

export default class Oscillator extends Component {

	constructor(props) {
		super(props);
		this.state = { timeMode: this.props.oscillator.freqNote ? 'note' : 'hz' };
	}

	handleWaveformChange(waveform) {
		this.props.onChange({...this.props.oscillator, waveform});
	}

	handleFrequencyChange(frequency) {
		this.props.onChange({...this.props.oscillator, frequency, freqNote: null});
	}

	handleAmplitudeChange(amplitude) {
		this.props.onChange({...this.props.oscillator, amplitude});
	}

	handleFreqNoteChange(freqNote) {
		this.props.onChange({...this.props.oscillator, freqNote});
	}

	render() {
		const { timeMode } = this.state;
		const { oscillator, onRemove } = this.props;
		const { frequency, amplitude, waveform, freqNote } = this.props.oscillator;
		return (
			<div className="oscillator">
				<label>
					Waveform: 
					<Select value={waveform} onChange={({value}) => this.handleWaveformChange(value)} clearable={false} options={waveforms} style={{width: 100}} />
				</label>
				<div>
					<Button label="hz" selected={timeMode == 'hz'} onClick={() => this.setState({timeMode: 'hz'})} />
					<ButtonIcon icon="note" size={11} selected={timeMode == 'note'} onClick={() => this.setState({timeMode: 'note'})} />
				</div>
				{timeMode == 'hz' ? (
					<NumberInput label="hz" min={0.1} max={100} step={0.1} value={frequency} onChange={::this.handleFrequencyChange} />
				) : (
					<label>
						<Select 
							value={freqNote} 
							options={timeSyntax}
							clearable={false}
							style={{width: 117}}
							optionRenderer={option => (<span><Icon name={option.icon} size={16} />{option.label}</span>)}
							onChange={({value}) => this.handleFreqNoteChange(value)} />
					</label>
				)}
				<NumberInput label="Amplitude" min={0} max={1} step={0.05} value={amplitude} onChange={::this.handleAmplitudeChange} />
				<OscillatorDisplay {...oscillator} />
				<Button label="Remove" icon="remove" onClick={onRemove} />
			</div>
		)
	}
}