import { combineReducers } from 'redux'
import transport from './transport'
import musicality from './musicality'
import gui from './gui'
import stage from './stage'
import oscillators from './oscillators'
import synths from './synths'

const reducers = combineReducers({
	transport,
	musicality,
	gui,
	stage,
	oscillators,
	synths,
});

export default reducers