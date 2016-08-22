import React, { Component } from 'react'

export default class NumberInput extends Component {

	static defaultProps = {
		label: 'Label',
	};

	render() {
		const { value, label, onChange, ...rest } = this.props;
		return (
			<label>
				{label && label+': '}
				<input type="number" value={value} size={3} onChange={event => onChange(event.target.value)} {...rest} />
			</label>
		)
	}
}