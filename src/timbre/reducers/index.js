import { combineReducers } from 'redux'
import transport from './transport'
import musicality from './musicality'
import envelope from './envelope'
import sound from './sound'
import gui from './gui'
import stage from './stage'

const reducers = combineReducers({
	transport,
	musicality,
	envelope,
	sound,
	gui,
	stage,
});

export default reducers