import React, { Component } from 'react'
import { connect } from 'react-redux'

import { STAGE, OSCILLATORS, MAPPINGS, FX } from '../constants/uiViews'

import Envelope from './Envelope'
import TopUI from './TopUI'
import MusicalityInterface from './MusicalityInterface'
import PrimaryInterface from './PrimaryInterface'
import OscillatorsInterface from './OscillatorsInterface'
import MappingsInterface from './MappingsInterface'
import FxInterface from './FxInterface'

class App extends Component {
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