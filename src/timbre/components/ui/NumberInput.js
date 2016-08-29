import React, { Component } from 'react'
import classname from 'classname'
import _throttle from 'lodash/throttle'
import _debounce from 'lodash/debounce'

import * as screenUtils from '../../utils/screenUtils'

export default class NumberInput extends Component {

	static defaultProps = {
		label: 'Label',
		className: '',
		step: 1,
	};

	constructor(props) {
		super(props);
		this.state = { invalid: false, dirtyValue: props.value };
		this.mouseDown = false;
		this.handleMouseMove = _throttle(this.handleMouseMove.bind(this), 1000/60);
		this.onChange = _throttle(this.onChange, 1000/5);
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

	isValid(value) {
		const { min, max } = this.props;
		return !(!value || (value && (value < min || value > max)));
	}

	handleChange(value) {
		if(value && typeof value == 'string') value = parseFloat(value);
		const invalid = !this.isValid(value);
		this.setState({invalid, dirtyValue: value});
		if(!invalid) this.onChange(value);
	}

	onChange(value) {
		this.props.onChange(value);
	}

	componentWillReceiveProps(nextProps) {
		if(nextProps.value != this.state.dirtyValue) {
			this.setState({invalid: false, dirtyValue: nextProps.value});
		}
	}

	render() {
		const { value, label, onChange, className, ...rest } = this.props;
		return (
			<label>
				{label && label+': '}
				<input 
					type="number" 
					value={this.state.dirtyValue} 
					size={3} 
					className={classname(className, this.state.invalid && 'invalid')}
					onChange={event => this.handleChange(event.target.value)}
					onMouseDown={::this.handleMouseDown} 
					{...rest} />
			</label>
		)
	}
}