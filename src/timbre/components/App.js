import React, { Component } from 'react'
import { connect } from 'react-redux'

import Envelope from './Envelope'
import MusicalityInterface from './MusicalityInterface'
import PrimaryInterface from './PrimaryInterface'

class App extends Component {
	render() {
		return(
			<main className="app">
				<div className="ui">
					<MusicalityInterface />
					<Envelope />
				</div>
				<PrimaryInterface />
			</main>
		)
	}
}

export default connect()(App);