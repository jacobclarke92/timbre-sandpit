import React, { Component } from 'react'
import newId from '../utils/newId';
import { addKeyListener } from '../utils/keyUtils'

export const modalHandler = {};

export default class ModalHost extends Component {

	constructor(props) {
		super(props);
		this.state = { modals: [] };
		this.addModal = this.addModal.bind(this);
		this.removeModal = this.removeModal.bind(this);
		this.removeTopModal = this.removeTopModal.bind(this);
		modalHandler.add = this.addModal;
		modalHandler.remove = this.removeModal;
		modalHandler.removeTop = this.removeTopModal;
		addKeyListener('esc', event => this.removeTopModal())
	}

	addModal(modal) {
		modal.id = newId(true);
		this.setState({modals: [...this.state.modals, modal]});
	}

	removeModal(modal) {
		this.setState({modals: this.state.modals.filter(_modal => _modal != modal)});
	}

	removeAll() {
		this.setState({modals: []});
	}

	removeTopModal() {
		const { modals } = this.state;
		modals.pop();
		this.setState({modals});
	}

	render() {
		const { modals } = this.state;
		const active = modals.length > 0;
		return (
			<div className={'modal-host '+(active ? '' : 'hide')}>
				<div className="modal-background" onClick={this.removeTopModal}></div>
				<div className="modals">
					{modals.map(modal => 
						<div key={modal.id} className="modal-container">
							<modal.Component {...modal.props} closeModal={() => this.removeModal(modal)} />
						</div>
					)}
				</div>
			</div>
		);
	}

}