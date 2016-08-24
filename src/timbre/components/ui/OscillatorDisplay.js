import React, { Component, PropTypes } from 'react'
import PIXI, { Container, Graphics } from 'pixi.js'
import { connect } from 'react-redux'
import $ from 'jquery'

import { getPixelDensity } from '../../utils/screenUtils'

class OscillatorDisplay extends Component {

	static defaultProps = {
		frequency: 1, // hz,
		amplitude: 1,
		wave: 'sine',
	}

	componentDidMount() {

		this.$canvas = $(this.refs.osc_canvas);
		this.width = this.$canvas.width();
		this.height = this.$canvas.height();

		this.renderer = new PIXI.CanvasRenderer/*autoDetectRenderer*/(this.width/getPixelDensity(), this.height/getPixelDensity(), {resolution: getPixelDensity(), transparent: false, backgroundColor: 0x000000, antialiasing: true});
		this.canvas = this.renderer.view;
		this.$canvas.append(this.canvas);

		this.stage = new Container();
		this.stage.position.y = this.height/2/getPixelDensity();
		this.stage.scale.set(1/getPixelDensity());

		this.indicator = new Graphics();
		this.indicator.beginFill(0xFFFFFF);
		this.indicator.drawCircle(0,0, 5);
		this.stage.addChild(this.indicator);

		this.animate();
	}

	componentWillUnmount() {

	}

	animate() {
		const { frequency, amplitude, transport } = this.props;
		const elapsed = Date.now() - transport.startTime;
		const freqMS = 1/(frequency)*1000;

		const positionX = (elapsed % freqMS)/freqMS;
		const positionY = Math.sin(positionX*Math.PI*2)*amplitude;

		this.indicator.position.x = positionX * this.width;
		this.indicator.position.y = positionY * this.height/2;

		this.renderer.render(this.stage);
		if(transport.playing) requestAnimationFrame(this.animate.bind(this));
	}

	componentWillReceiveProps(nextProps) {
		// force animation to start again if props updates
		if(nextProps.transport.playing && !this.props.transport.playing) setTimeout(() => this.animate());
	}

	render() {
		return (
			<div ref="osc_canvas" className="oscillator-display" />
		)
	}
}

export default connect(({transport}) => ({transport}))(OscillatorDisplay)