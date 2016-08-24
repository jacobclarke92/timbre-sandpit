import React, { Component } from 'react'
import { connect } from 'react-redux'

import { updateOscillator } from '../reducers/oscillators'
import Oscillator from './ui/Oscillator'

class OscillatorsInterface extends Component {

	handleOscillatorChange(oscillator) {
		this.props.dispatch(updateOscillator(oscillator));
	}

	render() {
		const { oscillators } = this.props;
		return (
			<div className="oscillators-interface">
				<p>Oscillators interface coming soon...</p>
				<div>
					{oscillators.map((oscillator, i) => 
						<Oscillator key={i} oscillator={oscillator} onChange={::this.handleOscillatorChange} />
					)}
				</div>
			</div>
		)
	}
}

export default connect(({oscillators}) => ({oscillators}))(OscillatorsInterface)