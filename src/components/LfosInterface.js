import React, { Component } from 'react'
import { connect } from 'react-redux'

import { addLfo, removeLfo, updateLfo } from '../reducers/lfos'
import Lfo from './ui/Lfo'
import Button from './ui/Button'

class LfosInterface extends Component {

	handleLfoAdd() {
		this.props.dispatch(addLfo());
	}

	handleLfoRemove(lfo) {
		this.props.dispatch(removeLfo(lfo.id));
	}

	handleLfoChange(lfo) {
		this.props.dispatch(updateLfo(lfo));
	}

	render() {
		const { lfos } = this.props;
		return (
			<div className="lfos-interface">
				<h1>LFOs</h1>
				<div>
					{lfos.map((lfo, i) => 
						<Lfo 
							key={i} 
							lfo={lfo} 
							onChange={::this.handleLfoChange} 
							onRemove={() => this.handleLfoRemove(lfo)} />
					)}
				</div>
				<Button label="Add LFO" icon="add" className="margin-top-medium" onClick={() => this.handleLfoAdd()} />
			</div>
		)
	}
}

export default connect(({lfos}) => ({lfos}))(LfosInterface)