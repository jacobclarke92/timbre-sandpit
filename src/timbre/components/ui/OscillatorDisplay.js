import React, { Component, PropTypes } from 'react'
import PIXI, { Container, Graphics } from 'pixi.js'
import { connect } from 'react-redux'
import { Time } from 'tone'
import $ from 'jquery'

import { getPixelDensity } from '../../utils/screenUtils'
import { getWaveLookupArray } from '../../utils/waveUtils'

class OscillatorDisplay extends Component {

	static defaultProps = {
		frequency: 1, // hz,
		amplitude: 1,
		waveform: 'sine',
	}

	componentDidMount() {

		this.$canvas = $(this.refs.osc_canvas);
		this.width = this.$canvas.width();
		this.height = this.$canvas.height();

		// No need to use a webGL instance for something like this
		this.renderer = new PIXI.CanvasRenderer(this.width/getPixelDensity(), this.height/getPixelDensity(), {resolution: getPixelDensity(), transparent: false, backgroundColor: 0x000000, antialiasing: true});
		this.canvas = this.renderer.view;
		this.$canvas.append(this.canvas);

		this.stage = new Container();
		this.stage.position.y = this.height/2/getPixelDensity();
		this.stage.scale.set(1/getPixelDensity());

		this.indicator = new Graphics();
		this.indicator.beginFill(0xFFFFFF);
		this.indicator.drawCircle(0,0, 5);
		this.stage.addChild(this.indicator);

		this.waveshape = new Graphics();
		this.stage.addChild(this.waveshape);

		this.generateWaveTable();
		this.drawWaveShape();
		this.animate();
	}

	componentWillUnmount() {

	}

	generateWaveTable(waveform = this.props.waveform) {
		this.waveTable = getWaveLookupArray(waveform, this.width);
	}

	drawWaveShape(amplitude = this.props.amplitude) {
		this.waveshape.cacheAsBitmap = false;
		this.waveshape.clear();
		this.waveshape.lineStyle(2, 0xFFFFFF, 0.2);
		for(let x = 0; x < this.waveTable.length; x++) {
			if(x === 0) this.waveshape.moveTo(x, this.waveTable[x] * this.height/2 * amplitude * -1);
			else this.waveshape.lineTo(x, this.waveTable[x] * this.height/2 * amplitude * -1);
		}
		this.waveshape.cacheAsBitmap = true;
	}

	animate() {
		const { frequency, amplitude, freqNote, transport } = this.props;
		const elapsed = Date.now() - transport.startTime;
		const freq = freqNote ? new Time(freqNote).toFrequency() : frequency;

		// convert hz to ms
		const freqMS = 1/(freq)*1000;

		// set x position based on cycle ms
		const percentX = (elapsed % freqMS)/freqMS;
		const positionX = percentX * this.width;

		// set y position based on waveTable lookup and flip phase for display
		const percentY = amplitude * this.waveTable[Math.floor(positionX)] * -1;
		const positionY = percentY * this.height/2;

		this.indicator.position.x = positionX;
		this.indicator.position.y = positionY;

		this.renderer.render(this.stage);
		if(transport.playing) requestAnimationFrame(this.animate.bind(this));
	}

	componentWillReceiveProps(nextProps) {
		// force animation to start again if props updates
		if(nextProps.transport.playing && !this.props.transport.playing) setTimeout(() => this.animate());

		// update wave table if required
		if(nextProps.waveform != this.props.waveform) {
			this.generateWaveTable(nextProps.waveform);
			this.drawWaveShape(nextProps.amplitude);
		}else if(nextProps.amplitude != this.props.amplitude) {
			this.drawWaveShape(nextProps.amplitude);
		}
	}

	render() {
		return (
			<div ref="osc_canvas" className="oscillator-display" />
		)
	}
}

export default connect(({transport}) => ({transport}))(OscillatorDisplay)