import React, { Component } from 'react'
import { connect } from 'react-redux'
import $ from 'jquery'

import { addKeyListener } from '../utils/keyUtils'
import { changeView, changeTool } from '../reducers/gui'
import { STAGE, OSCILLATORS, MAPPINGS, FX } from '../constants/uiViews'
import { ORIGIN_RING_NODE, ORIGIN_RADAR_NODE, POINT_NODE, ARC_NODE } from '../constants/nodeTypes'

import TopUI from './TopUI'
import BottomUI from './BottomUI'
import MusicalityInterface from './MusicalityInterface'
import PrimaryInterface from './PrimaryInterface'
import OscillatorsInterface from './OscillatorsInterface'
import MappingsInterface from './MappingsInterface'
import FxInterface from './FxInterface'

class App extends Component {

	componentDidMount() {
		addKeyListener('q', () => this.props.dispatch(changeView(STAGE)));
		addKeyListener('w', () => this.props.dispatch(changeView(OSCILLATORS)));
		addKeyListener('e', () => this.props.dispatch(changeView(MAPPINGS)));
		addKeyListener('r', () => this.props.dispatch(changeView(FX)));
		addKeyListener('1', () => this.props.dispatch(changeTool(ORIGIN_RING_NODE)));
		addKeyListener('2', () => this.props.dispatch(changeTool(ORIGIN_RADAR_NODE)));
		addKeyListener('3', () => this.props.dispatch(changeTool(POINT_NODE)));
		addKeyListener('4', () => this.props.dispatch(changeTool(ARC_NODE)));
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