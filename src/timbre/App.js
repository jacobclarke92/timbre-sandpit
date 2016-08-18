import React, { Component } from 'react'
import { connect } from 'react-redux'

import Envelope from './components/Envelope'
import MusicalityInterface from './components/MusicalityInterface'

class App extends Component {
	render() {
		return(
			<main className="app">
				<div className="ui">
					<MusicalityInterface />
					<Envelope />
				</div>
				{/*<PrimaryInterface />*/}
			</main>
		)
	}
}

export default connect()(App);