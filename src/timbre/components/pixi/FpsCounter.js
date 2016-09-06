import React, { Component } from 'react'
import PIXI, { Text } from 'pixi.js'
import { getPixelDensity } from '../../utils/screenUtils'

export default class FpsCounter extends Component {

	constructor(props) {
		super(props);
		this.fps = new Text('', {font: '16px Orbitron', fontWeight: '500', fill: 'white'});
		this.fps.scale.set(1/getPixelDensity());
		this.fps.position = {x: 5, y: 5};
		this.fpsCache = new Array(60).map(t => 60);
		this.lastFps = Date.now();
	}

	render(props) {
		const now = Date.now();
		const currentFps = 1/(now-this.lastFps)*1000;
		this.fpsCache.push(currentFps);
		this.fpsCache.shift();
		const fps = this.fpsCache.reduce((prev, current) => prev+current, 0)/this.fpsCache.length;
		this.fps.text = Math.round(fps);
		this.lastFps = now;
		return this.fps;
	}
}