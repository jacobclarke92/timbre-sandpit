import React, { Component, PropTypes } from 'react'
import OscillatorDisplay from './OscillatorDisplay'

export default class Oscillator extends Component {
	render() {
		return (
			<OscillatorDisplay {...this.props} />
		)
	}
}