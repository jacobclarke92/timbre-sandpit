import React, { Component } from 'react'
import { connect } from 'react-redux'

import { STAGE, OSCILLATORS, MAPPINGS, FX } from '../constants/uiViews'
import { addKeyListener } from '../utils/keyUtils'
import { changeView } from '../reducers/gui'

import Envelope from './Envelope'
import TopUI from './TopUI'
import MusicalityInterface from './MusicalityInterface'
import PrimaryInterface from './PrimaryInterface'
import OscillatorsInterface from './OscillatorsInterface'
import MappingsInterface from './MappingsInterface'
import FxInterface from './FxInterface'

class App extends Component {

	componentDidMount() {
		addKeyListener('1', () => this.props.dispatch(changeView(STAGE)));
		addKeyListener('2', () => this.props.dispatch(changeView(OSCILLATORS)));
		addKeyListener('3', () => this.props.dispatch(changeView(MAPPINGS)));
		addKeyListener('4', () => this.props.dispatch(changeView(FX)));
	}

	render() {
		const { view } = this.props.gui || {};
		return(
			<main className="app">
				<TopUI />
				<div className="interface-container">
					<PrimaryInterface />
					{view == OSCILLATORS && <OscillatorsInterface />}
					{view == MAPPINGS && <MappingsInterface />}
					{view == FX && <FxInterface />}
				</div>
			</main>
		)
	}
}

export default connect(({gui}) => ({gui}))(App);