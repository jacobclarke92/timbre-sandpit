import React, { Component } from 'react'
import $ from 'jquery'

import { addResizeCallback, removeResizeCallback, getScreenWidth, getScreenHeight } from '../utils/screenUtils'
import FxInterfaceRenderer from './pixi/FxInterfaceRenderer'

export default class FxInterface extends Component {

	constructor(props) {
		super(props);
		this.handleResize = this.handleResize.bind(this);
		this.state = {
			width: 800,
			height: 450,
			offsetY: 136,
		};
	}

	componentDidMount() {

		this.$container = $(this.refs.renderer.refs.container);

		// bind window resize
		addResizeCallback(this.handleResize);
		this.handleResize();
	}

	componentWillUnmount() {
		removeResizeCallback(this.handleResize);
	}

	handleResize() {
		this.setState({
			width: this.$container.width(),
			height: this.$container.height(),
			offsetY: this.$container.offset().top,
		});
	}

	render() {
		const { width, height } = this.state;
		return (
			<FxInterfaceRenderer 
				ref="renderer" 
				width={width} 
				height={height}>

			</FxInterfaceRenderer>
		)
	}
}