import { combineReducers } from 'redux'
import transport from './transport'
import musicality from './musicality'
import envelope from './envelope'
import sound from './sound'
import gui from './gui'
import stage from './stage'
import oscillators from './oscillators'

const reducers = combineReducers({
	transport,
	musicality,
	envelope,
	sound,
	gui,
	stage,
	oscillators,
});

export default reducers