import { combineReducers } from 'redux'
import animating from './animating'
import musicality from './musicality'
import envelope from './envelope'
import sound from './sound'

const reducers = combineReducers({
	animating,
	musicality,
	envelope,
	sound,
});

export default reducers