import React, { Component } from 'react'
import classname from 'classname'

import Icon from './Icon'

export default class ButtonIcon extends Component {
	render() {
		const { icon, label, selected, size, className, ...rest} = this.props;
		return (
			<button type="button" className={classname('button-icon', className, selected && 'active')} data-label={label} {...rest}>
				<Icon name={icon} size={size} />
			</button>
		)
	}
}