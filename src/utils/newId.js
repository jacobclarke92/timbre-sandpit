import localStore from 'store'

let idCounter = localStore.get('newId') || 0;
let sysIdCounter = 0;

/**
 * Simple function for returning incremental ids.
 * @param  {Boolean} sys If true will not update id counter in localstorage
 * @return {Boolean}
 */
export default function newId(sys = false) {
	if(sys) {
		sysIdCounter ++;
		return sysIdCounter;
	}else{
		idCounter++;
		localStore.set('newId', idCounter);
		return idCounter
	}
}