import React, { Component, PropTypes } from 'react'
import Select from 'react-select'

import timeSyntax from '../../constants/timeSyntax'
import { SINE, SQUARE, TRIANGLE, SAWTOOTH } from '../../constants/waveTypes'
import LfoDisplay from './LfoDisplay'
import NumberInput from './NumberInput'
import Icon from './Icon'
import Button from './Button'
import ButtonIcon from './ButtonIcon'

const waveforms = [SINE, SQUARE, TRIANGLE, SAWTOOTH].map(value => ({value, label: value}));

export default class Lfo extends Component {

	constructor(props) {
		super(props);
		this.state = { timeMode: this.props.lfo.freqNote ? 'note' : 'hz' };
	}

	handleWaveformChange(waveform) {
		this.props.onChange({...this.props.lfo, waveform});
	}

	handleFrequencyChange(frequency) {
		this.props.onChange({...this.props.lfo, frequency, freqNote: null});
	}

	handleAmplitudeChange(amplitude) {
		this.props.onChange({...this.props.lfo, amplitude});
	}

	handleFreqNoteChange(freqNote) {
		this.props.onChange({...this.props.lfo, freqNote});
	}

	render() {
		const { timeMode } = this.state;
		const { lfo, onRemove } = this.props;
		const { frequency, amplitude, waveform, freqNote } = this.props.lfo;
		return (
			<div className="lfo">
				<label>
					Waveform: 
					<Select value={waveform} onChange={({value}) => this.handleWaveformChange(value)} clearable={false} options={waveforms} style={{width: 100}} />
				</label>
				<div>
					<Button label="hz" selected={timeMode == 'hz'} onClick={() => this.setState({timeMode: 'hz'})} />
					<ButtonIcon icon="note" size="xsmall" selected={timeMode == 'note'} onClick={() => this.setState({timeMode: 'note'})} />
				</div>
				{timeMode == 'hz' ? (
					<NumberInput label="hz" min={0.1} max={100} step={0.1} value={frequency} onChange={::this.handleFrequencyChange} />
				) : (
					<label>
						<Select 
							value={freqNote} 
							options={timeSyntax}
							clearable={false}
							style={{width: 110}}
							optionRenderer={option => (<span><Icon name={option.icon} size="small" />{option.label}</span>)}
							onChange={({value}) => this.handleFreqNoteChange(value)} />
					</label>
				)}
				<NumberInput label="Amplitude" min={0} max={1} step={0.05} value={amplitude} onChange={::this.handleAmplitudeChange} />
				<LfoDisplay {...lfo} />
				<Button label="Remove" icon="remove" onClick={onRemove} />
			</div>
		)
	}
}