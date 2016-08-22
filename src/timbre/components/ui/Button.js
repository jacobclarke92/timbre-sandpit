import React, { Component } from 'react'
import classname from 'classname'

import Icon from './Icon'

export default class Button extends Component {
	render() {
		const { label, selected, icon, ...rest} = this.props;
		return (
			<button type="button" className={classname('button', selected && 'active')} {...rest}>
				{icon && <Icon name={icon} />} <span>{label}</span>
			</button>
		)
	}
}