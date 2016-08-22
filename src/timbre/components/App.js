import React, { Component } from 'react'
import { connect } from 'react-redux'

import Envelope from './Envelope'
import TopUI from './TopUI'
import MusicalityInterface from './MusicalityInterface'
import PrimaryInterface from './PrimaryInterface'

class App extends Component {
	render() {
		return(
			<main className="app">
				<TopUI />
					{/*<MusicalityInterface />
					<Envelope />
				</div>
				*/}
				<PrimaryInterface />
			</main>
		)
	}
}

export default connect()(App);