// little id function to not have clashing ids
let idCounter = 0;
export default function newId() {
	return ++idCounter;
}