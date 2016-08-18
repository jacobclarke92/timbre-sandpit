import React, { Component } from 'react'
import { connect } from 'react-redux'
import $ from 'jquery'
import Tone, { Synth } from 'tone'
import sc from 'subcollider'
import PIXI, { Container, Graphics, Sprite } from 'pixi.js'
import Point from '../Point'
import { getPixelDensity, addResizeCallback } from '../utils/screenUtils'
import { dist } from '../utils/mathUtils'
import newId from '../utils/newId'

import noteColors from '../constants/noteColors'
import * as AnchorTypes from '../constants/anchorTypes'

class PrimaryInterface extends Component {

	static defaultProps = {
		reactive: false,
		showGuides: true,
		guideDivisions: 8,
		guideSubdivisions: 4,
		radialDivisions: 4,
		radialSubdivisions: 3,
	};

	componentDidMount() {
		const $container = $(this.refs.container);
		this.width = $container.width();
		this.height = $container.height();
		this.renderer = new PIXI.autoDetectRenderer(this.width, this.height, {resolution: getPixelDensity(), transparent: false, backgroundColor: 0x000000, antialiasing: true});
		this.canvas = this.renderer.view;
		$container.append(this.canvas);
		addResizeCallback(() => {
			this.width = $container.width();
			this.height = $container.height();
			this.renderer.resize(this.width, this.height);
		});

		this.stage = new Container();
		this.mounted = true;
	}

	animate() {


		this.renderer.render(this.stage);
		if(this.props.animating) requestAnimationFrame(this.animate.bind(this));
	}

	shouldComponentUpdate() {
		return !this.mounted;
	}

	render() {
		return (
			<div ref="container"></div>
		)
	}

}

export default connect(({musicality, envelope, animating}) => ({musicality, envelope, animating}))(PrimaryInterface)