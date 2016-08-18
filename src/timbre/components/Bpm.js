import React, { Component } from 'react'

export default class Bpm extends Component {
	render() {
		const { value, onChange } = this.props;
		return (
			<label>
				BPM: 
				<input type="number" value={value} size={3} onChange={event => onChange(event.target.value)} />
			</label>
		)
	}
}