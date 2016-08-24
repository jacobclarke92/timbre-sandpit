import React, { Component, PropTypes } from 'react'

import OscillatorDisplay from './OscillatorDisplay'
import NumberInput from './NumberInput'

export default class Oscillator extends Component {

	handleFrequencyChange(frequency) {
		this.props.onChange({...this.props.oscillator, frequency});
	}

	handleAmplitudeChange(amplitude) {
		this.props.onChange({...this.props.oscillator, amplitude});
	}

	render() {
		const { oscillator } = this.props;
		const { frequency, amplitude } = this.props.oscillator;
		return (
			<div className="oscillator">
				<OscillatorDisplay {...oscillator} />
				<NumberInput label="Frequency" min={0.1} max={100} step={0.1} value={frequency} onChange={::this.handleFrequencyChange} />
				<NumberInput label="Amplitude" min={0} max={1} step={0.05} value={amplitude} onChange={::this.handleAmplitudeChange} />
			</div>
		)
	}
}