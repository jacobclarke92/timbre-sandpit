import React, { Component } from 'react'
import PIXI, { Container, Graphics } from 'pixi.js'

import { BEAT_PX } from '../../constants/globals'

export default class ActiveNodeIndicator extends Component {

	constructor(props) {
		super(props);
		this.rings = [];
		this.ringFX = new Container();
	}

	createRing() {
		const ring = new Graphics();
		ring.lineStyle(3, color, 1);
		ring.drawCircle(0, 0, BEAT_PX*3);
		ring.cacheAsBitmap = true;
		ring.scale.set(0);
		ring.position = position;
		ring.counter = 0;
		this.rings.push(ring);
	}

	render() {
		for(let ring of this.rings) {
			ring.scale.set(ring.scale.x + (this.props.bpm/11000)*ring.speed); // just eyeballed this one
			if(++ring.counter >= 60) {
				if(ring.alpha > 0) ring.alpha -= 0.05;
				else this.ringFX.removeChild(ring);
			}
		}
		this.rings = this.rings.filter(ring => ring.alpha > 0);
		return this.ringFX;
	}
}