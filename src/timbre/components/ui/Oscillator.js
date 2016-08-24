import React, { Component, PropTypes } from 'react'
import Select from 'react-select'

import { SINE, SQUARE, TRIANGLE, SAWTOOTH } from '../../constants/waveTypes'
import OscillatorDisplay from './OscillatorDisplay'
import NumberInput from './NumberInput'
import Button from './Button'

const waveforms = [SINE, SQUARE, TRIANGLE, SAWTOOTH].map(value => ({value, label: value}));

export default class Oscillator extends Component {

	handleWaveformChange(waveform) {
		this.props.onChange({...this.props.oscillator, waveform});
	}

	handleFrequencyChange(frequency) {
		this.props.onChange({...this.props.oscillator, frequency});
	}

	handleAmplitudeChange(amplitude) {
		this.props.onChange({...this.props.oscillator, amplitude});
	}

	render() {
		const { oscillator, onRemove } = this.props;
		const { frequency, amplitude, waveform } = this.props.oscillator;
		return (
			<div className="oscillator">
				<label>
					Waveform: 
					<Select value={waveform} onChange={({value}) => this.handleWaveformChange(value)} clearable={false} options={waveforms} style={{width: 100}} />
				</label>
				<NumberInput label="Frequency (hz)" min={0.1} max={100} step={0.1} value={frequency} onChange={::this.handleFrequencyChange} />
				<NumberInput label="Amplitude" min={0} max={1} step={0.05} value={amplitude} onChange={::this.handleAmplitudeChange} />
				<OscillatorDisplay {...oscillator} />
				<Button label="Remove" icon="remove" onClick={onRemove} />
			</div>
		)
	}
}