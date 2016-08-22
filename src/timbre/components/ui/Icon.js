import React, { Component } from 'react'
import icons from '../../constants/icons'

export default class Icon extends Component {

	static defaultProps = {
		size: 24,
		style: {},
	};

	render() {
		const { size, name, style, ...rest } = this.props;
		const styles = {...style, width: size, height: size};

		return (
			<svg viewBox="0 0 24 24" style={styles} preserveAspectRatio="xMidYMid meet" {...rest}>
				{icons[name]}
			</svg>
		)
	}
}