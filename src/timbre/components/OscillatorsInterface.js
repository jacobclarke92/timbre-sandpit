import React, { Component } from 'react'
import { connect } from 'react-redux'

import { addOscillator, removeOscillator, updateOscillator } from '../reducers/oscillators'
import Oscillator from './ui/Oscillator'
import Button from './ui/Button'

class OscillatorsInterface extends Component {

	handleOscillatorAdd() {
		this.props.dispatch(addOscillator());
	}

	handleOscillatorRemove(oscillator) {
		this.props.dispatch(removeOscillator(oscillator.id));
	}

	handleOscillatorChange(oscillator) {
		this.props.dispatch(updateOscillator(oscillator));
	}

	render() {
		const { oscillators } = this.props;
		return (
			<div className="oscillators-interface">
				<h1>Oscillators</h1>
				<div>
					{oscillators.map((oscillator, i) => 
						<Oscillator 
							key={i} 
							oscillator={oscillator} 
							onChange={::this.handleOscillatorChange} 
							onRemove={() => this.handleOscillatorRemove(oscillator)} />
					)}
				</div>
				<Button label="Add Oscillator" icon="add" className="margin-top-medium" onClick={() => this.handleOscillatorAdd()} />
			</div>
		)
	}
}

export default connect(({oscillators}) => ({oscillators}))(OscillatorsInterface)