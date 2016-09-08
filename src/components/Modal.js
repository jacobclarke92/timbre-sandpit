import React, { Component } from 'react'

import ButtonIcon from './ui/ButtonIcon'
import ConfirmCancel from './ui/ConfirmCancel'

const DefaultHeader = ({title}) => (<h3>{title}</h3>);

export default class Modal extends Component {

	static defaultProps = {
		Header: DefaultHeader,
		Footer: ConfirmCancel,
		onSave: () => {},
		onClose: () => {},
	};

	render() {
		const { Header, Footer, children, ...props } = this.props;
		return (
			<div className="modal">
				<div className="modal-header">
					<Header {...props} />
					<ButtonIcon icon="close" onClick={() => this.props.onClose()} />
				</div>
				<div className="modal-body">
					{children}
				</div>
				<div className="modal-footer">
					<Footer {...props} />
				</div>
			</div>
		)
	}

}