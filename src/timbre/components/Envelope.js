import PIXI, { Container, Graphics } from 'pixi.js'
import React, { Component } from 'react'
import { connect } from 'react-redux'
import $ from 'jquery'

import Point from '../Point'
import { getPixelDensity, addResizeCallback } from '../utils/screenUtils'


class Envelope extends Component {

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
		this.graphics = new Graphics();
		this.stage.addChild(this.graphics);


		this.mounted = true;
		this.animate();
	}

	animate() {
		const { attack, decay, sustain, release, max } = this.props.envelope || {};

		this.graphics.clear();
		this.graphics.lineStyle(2, 0xFFFFFF);
		const point1 = new Point(0, this.height);
		const point2 = new Point(point1.x + (attack/max)*this.width, 0);
		const point3 = new Point(point2.x + (decay/max)*this.width, this.height - this.height*sustain);
		const point4 = new Point(point3.x + this.width/8, point3.y);
		const point5 = new Point(point4.x + (release/max)*this.width, this.height);
		this.graphics.moveTo(point1.x, point1.y);
		this.graphics.lineTo(point2.x, point2.y);
		this.graphics.lineTo(point3.x, point3.y);
		this.graphics.lineTo(point4.x, point4.y);
		this.graphics.lineTo(point5.x, point5.y);
		this.graphics.beginFill(0xFFFFFF);
		this.graphics.drawCircle(point2.x, point2.y, 8);
		this.graphics.drawCircle(point3.x, point3.y, 8);
		this.graphics.drawCircle(point5.x, point5.y, 8);

		this.renderer.render(this.stage);
		if(this.props.animating) requestAnimationFrame(this.animate.bind(this));
	}

	shouldComponentUpdate() {
		return !this.mounted;
	}

	render() {
		return (
			<div className="envelope-container" ref="container"></div>
		)
	}
}

export default connect(({envelope, animating}) => ({envelope, animating}))(Envelope)