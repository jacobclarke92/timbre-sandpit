import React, { Component, PropTypes } from 'react'
import _throttle from 'lodash/throttle'
import $ from 'jquery'

const mouseMoveThrottle = 1000/50; // 50fps

export default class Tooltip extends Component {

	static defaultProps = {
		text: null,
	};

	constructor(props) {
		super();
		this.handleMouseMove = _throttle(this.handleMouseMove.bind(this), mouseMoveThrottle);
		this.state = {
			x: 0,
			y: 0,
		}
	}

	componentDidMount() {
		$(window).on('mousemove', this.handleMouseMove);
	}

	componentWillUnmount() {
		$(window).off('mousemove', this.handleMouseMove);
	}

	handleMouseMove(event) {
		if(!this.props.text) return;
		this.setState({x: event.clientX || 0, y: event.clientY || 0});
	}

	render() {
		const translate = 'translate('+this.state.x+'px, '+this.state.y+'px)';
		return this.props.text ? (
			<div className="tooltip" style={{transform: translate, WebkitTransform: translate}}>
				<div className="tooltip-inner">{this.props.text}</div>
			</div>
		) : null;
	}

}