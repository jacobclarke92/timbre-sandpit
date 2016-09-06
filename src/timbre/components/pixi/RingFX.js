import React, { Component } from 'react'
import PIXI, { Container, Graphics } from 'pixi.js'

import { BEAT_PX } from '../../constants/globals'

export default class RingFX extends Component {

	constructor(props) {
		super(props);
		this.counter = 0;
		this.ring = new Graphics();
		this.ring.lineStyle(6, props.color, 1);
		this.ring.drawCircle(0, 0, BEAT_PX*12);
		this.ring.cacheAsBitmap = true;
		this.ring.scale.set(0);
		this.ring.position = props.position;
	}

	render() {
		this.ring.scale.set(this.ring.scale.x + (this.props.bpm/44000)*this.props.speed); // just eyeballed this one
		if(++this.counter >= 60) {
			if(this.ring.alpha > 0) this.ring.alpha -= 0.05;
			else this.props.onRemoveRingFX();
		}
		return this.ring;
	}
}