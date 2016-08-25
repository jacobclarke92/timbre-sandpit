import React, { Component } from 'react'
import { connect } from 'react-redux'
import $ from 'jquery'

import { STAGE, OSCILLATORS, MAPPINGS, FX } from '../constants/uiViews'
import { addKeyListener } from '../utils/keyUtils'
import { changeView } from '../reducers/gui'

import TopUI from './TopUI'
import BottomUI from './BottomUI'
import MusicalityInterface from './MusicalityInterface'
import PrimaryInterface from './PrimaryInterface'
import OscillatorsInterface from './OscillatorsInterface'
import MappingsInterface from './MappingsInterface'
import FxInterface from './FxInterface'

class App extends Component {

	componentDidMount() {
		addKeyListener('1', () => this.changeView(STAGE));
		addKeyListener('2', () => this.changeView(OSCILLATORS));
		addKeyListener('3', () => this.changeView(MAPPINGS));
		addKeyListener('4', () => this.changeView(FX));
	}

	changeView(view) {
		this.props.dispatch(changeView(view));
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
				<BottomUI />
			</main>
		)
	}
}

export default connect(({gui}) => ({gui}))(App);