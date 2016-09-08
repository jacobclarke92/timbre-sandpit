import React, { Component } from 'react'
import classname from 'classname'

import Icon from './Icon'

export default class Button extends Component {

	static defaultProps = {
		label: 'Select',
		size: 'medium',
		icon: null,
		selected: false,
		className: null,
		disabled: false,
	};

	render() {
		const { label, selected, icon, size, disabled, className, ...rest} = this.props;
		return (
			<button type="button" className={classname('button', className, selected && 'active', disabled && 'disabled', size)} {...rest}>
				{icon && <Icon name={icon} size={size} />} <span>{label}</span>
			</button>
		)
	}
}