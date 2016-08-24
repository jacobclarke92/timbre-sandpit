import React, { Component } from 'react'
import classname from 'classname'

import Icon from './Icon'

export default class Button extends Component {
	render() {
		const { label, selected, icon, className, ...rest} = this.props;
		return (
			<button type="button" className={classname('button', className, selected && 'active')} {...rest}>
				{icon && <Icon name={icon} />} <span>{label}</span>
			</button>
		)
	}
}