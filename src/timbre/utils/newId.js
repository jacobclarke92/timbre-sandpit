import localStore from 'store'

// little id function to not have clashing ids
let idCounter = localStore.get('newId') || 0;
export default function newId() {
	idCounter++;
	localStore.set('newId', idCounter);
	return idCounter;
}