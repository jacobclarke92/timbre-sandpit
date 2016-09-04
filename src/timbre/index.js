import React from 'react'
import ReactDOM from 'react-dom'
import { createStore } from 'redux'
import { Provider } from 'react-redux'
import localStore from 'store'
import $ from 'jquery'

import '../../styles/index.less'
import App from './components/App'
import reducers from './reducers/index'
import * as Sound  from './sound'
import * as NodeGenerators  from './nodeGenerators'
import * as NodeGraphics  from './nodeGraphics'
import * as keyUtils  from './utils/keyUtils'
import * as SpatialUtils from './nodeSpatialUtils'
import * as Timing from './timing'
import { TRANSPORT_START } from './constants/actionTypes'
import { startTransport, stopTransport, setBpm } from './reducers/transport'

// create redux store 
let store = createStore(reducers);
window.logStore = () => console.log(store.getState());

// give store to those in need
Sound.receiveStore(store);
NodeGraphics.receiveStore(store);
NodeGenerators.receiveStore(store);
SpatialUtils.receiveStore(store);
Timing.receiveStore(store);

// press play
stopTransport();
setTimeout(() => {
	setBpm(128);
	store.dispatch({type: TRANSPORT_START});
}, 100);

// init key listeners
keyUtils.init();

// save store upon page leave, but clear it if L+R arrow keys are down
$(window).on('beforeunload', () => {
	if(keyUtils.isLeftKeyPressed() && keyUtils.isRightKeyPressed()) {
		localStore.clear();
	}else{
		const state = store.getState();
		for(let key of Object.keys(state)) {
			localStore.set(key, state[key]);
		}
	}
});

// render react app
ReactDOM.render(
	<Provider store={store}>
		<App />
	</Provider>, 
	$('#app')[0]
);