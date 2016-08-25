import React from 'react'
import ReactDOM from 'react-dom'
import { createStore } from 'redux'
import { Provider } from 'react-redux'

import '../../styles/index.less'
import App from './components/App'
import reducers from './reducers/index'
import * as Sound  from './sound'
import * as NodeGenerators  from './nodeGenerators'
import * as NodeGraphics  from './nodeGraphics'
import * as keyUtils  from './utils/keyUtils'

let store = createStore(reducers);
Sound.receiveStore(store);
NodeGraphics.receiveStore(store);
NodeGenerators.receiveStore(store);

keyUtils.init();
window.logStore = () => console.log(store.getState());

ReactDOM.render(
	<Provider store={store}>
		<App />
	</Provider>, 
	document.getElementById('app')
);