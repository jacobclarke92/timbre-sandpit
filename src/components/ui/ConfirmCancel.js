import React, { Component } from 'react'
import Button from './Button'

export default class ConfirmCancel extends Component {

	static defaultProps = {
		onSave: () => {},
		onClose: () => {},
	};

	render() {
		return (
			<div>
				<Button label="Confirm" selected onClick={() => this.props.onSave()} />
				<Button label="Cancel" onClick={() => this.props.onClose()} />
			</div>
		)
	}

}