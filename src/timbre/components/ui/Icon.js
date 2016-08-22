import React, { Component } from 'react'
import icons from '../../constants/icons'

export default class Icon extends Component {

	static defaultProps = {
		size: 24,
	};

	render() {
		const style = {
			width: this.props.size,
			height: this.props.size,
		};

		return (
			<svg viewBox="0 0 24 24" style={style} preserveAspectRatio="xMidYMid meet">
				{icons[this.props.name]}
			</svg>
		)
	}
}