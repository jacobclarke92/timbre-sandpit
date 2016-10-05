import { combineReducers } from 'redux'
import transport from './transport'
import musicality from './musicality'
import gui from './gui'
import stage from './stage'
import oscillators from './oscillators'
import synths from './synths'
import fx from './fx'
import desk from './desk'

const reducers = combineReducers({
	transport,
	musicality,
	gui,
	stage,
	oscillators,
	synths,
	fx,
	desk,
});

export default reducers