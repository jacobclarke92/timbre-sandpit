import React, { Component } from 'react'

import Oscillator from './ui/Oscillator'

export default class OscillatorsInterface extends Component {
	render() {
		return (
			<div className="oscillators-interface">
				<p>Oscillators interface coming soon...</p>
				<div>
					{[...Array(10)].map((item, i) => <Oscillator key={i} frequency={(i+1)/2} />)}
				</div>
			</div>
		)
	}
}