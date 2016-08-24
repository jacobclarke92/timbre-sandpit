import React, { Component } from 'react'
import _throttle from 'lodash/throttle'

import * as screenUtils from '../../utils/screenUtils'

export default class NumberInput extends Component {

	static defaultProps = {
		label: 'Label',
		step: 1,
	};

	constructor(props) {
		super(props);
		this.mouseDown = false;
		this.handleMouseMove = _throttle(this.handleMouseMove.bind(this), 1000/60);
		document.addEventListener('mouseup', ::this.handleMouseUp);
	}

	handleMouseDown(event) {
		this.mouseDown = true;
		screenUtils.requestPointerLock(event.target);
		document.addEventListener('mousemove', this.handleMouseMove);
	}

	handleMouseUp(event) {
		if(this.mouseDown) {
			screenUtils.exitPointerLock();
			document.removeEventListener('mousemove', this.handleMouseMove);
			this.mouseDown = false;
		}
	}

	handleMouseMove(event) {
		if(this.mouseDown) {
			const { min, max, step, value, onChange } = this.props;
			const movementY = event.movementY || event.mozMovementY || 0;
			const amount = -movementY*step;
			let newValue = value + amount;
			if(min && newValue < min) newValue = min;
			if(max && newValue > max) newValue = max;
			newValue = Math.round(newValue*1000)/1000; // fix javascript float shitness
			if(amount) onChange(newValue);
		}
	}

	render() {
		const { value, label, onChange, ...rest } = this.props;
		return (
			<label>
				{label && label+': '}
				<input 
					type="number" 
					value={value} 
					size={3} 
					onChange={event => onChange(event.target.value)} {...rest}
					onMouseDown={::this.handleMouseDown} />
			</label>
		)
	}
}