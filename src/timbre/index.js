import React from 'react'
import ReactDOM from 'react-dom'
import { createStore } from 'redux'
import { Provider } from 'react-redux'

import App from './App'
import reducers from './reducers/index'

/*
import * as PrimaryInterface from './PrimaryInterface'
import * as ScaleControls from './ScaleControls'
import * as EnvelopeInterface from './EnvelopeInterface'
import * as screenUtils from './utils/screenUtils'
*/
let store = createStore(reducers);

console.log(store, store.getState());

/*
ScaleControls.init({
	scale: 'C',
	mode: 'lydian',
});
EnvelopeInterface.init();
PrimaryInterface.init();
*/

ReactDOM.render(
	<Provider store={store}>
		<App />
	</Provider>, 
	document.getElementById('app')
);