import { combineReducers } from 'redux'
import animating from './animating'
import musicality from './musicality'
import envelope from './envelope'

const reducers = combineReducers({
	animating,
	musicality,
	envelope,
});

export default reducers