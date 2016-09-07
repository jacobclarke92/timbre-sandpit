import React, { Component } from 'react'
import { connect } from 'react-redux'
import $ from 'jquery'

import { changeView, changeTool } from '../reducers/gui'
import { addKeyListener, isCommandKeyPressed } from '../utils/keyUtils'
import { STAGE, CHORDS, OSCILLATORS, MAPPINGS, FX } from '../constants/uiViews'
import { ORIGIN_RING_NODE, ORIGIN_RADAR_NODE, POINT_NODE, ARC_NODE } from '../constants/nodeTypes'

import TopUI from './TopUI'
import BottomUI from './BottomUI'
import PrimaryInterface from './PrimaryInterface'
import ChordsInterface from './ChordsInterface'
import OscillatorsInterface from './OscillatorsInterface'
import MappingsInterface from './MappingsInterface'
import FxInterface from './FxInterface'

class App extends Component {

	componentDidMount() {
		addKeyListener('q', () => { if(!isCommandKeyPressed()) this.props.dispatch(changeView(STAGE)) });
		addKeyListener('w', () => { if(!isCommandKeyPressed()) this.props.dispatch(changeView(CHORDS)) });
		addKeyListener('e', () => { if(!isCommandKeyPressed()) this.props.dispatch(changeView(OSCILLATORS)) });
		addKeyListener('r', () => { if(!isCommandKeyPressed()) this.props.dispatch(changeView(MAPPINGS)) });
		addKeyListener('t', () => { if(!isCommandKeyPressed()) this.props.dispatch(changeView(FX)) });

		addKeyListener('a', () => { if(!isCommandKeyPressed()) this.props.dispatch(changeTool(ORIGIN_RING_NODE)) });
		addKeyListener('s', () => { if(!isCommandKeyPressed()) this.props.dispatch(changeTool(ORIGIN_RADAR_NODE)) });
		addKeyListener('d', () => { if(!isCommandKeyPressed()) this.props.dispatch(changeTool(POINT_NODE)) });
		addKeyListener('f', () => { if(!isCommandKeyPressed()) this.props.dispatch(changeTool(ARC_NODE)) });
	}

	render() {
		const { view } = this.props.gui || {};
		return(
			<main className="app">
				<TopUI />
				<div className="interface-container">
					<PrimaryInterface />
					{view == CHORDS && <ChordsInterface />}
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