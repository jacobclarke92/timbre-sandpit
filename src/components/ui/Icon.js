import React, { Component } from 'react'
import icons from '../../constants/icons'

const sizes = {
	xsmall: 12,
	small: 18,
	medium: 24,
	large: 32,
	xlarge: 48,
}

export default class Icon extends Component {

	static defaultProps = {
		size: 'medium',
		style: {},
	};

	render() {
		const { size, name, style, ...rest } = this.props;
		const styles = {...style, width: sizes[size], height: sizes[size]};

		return (
			<svg viewBox="0 0 24 24" style={styles} preserveAspectRatio="xMidYMid meet" {...rest}>
				{icons[name]}
			</svg>
		)
	}
}