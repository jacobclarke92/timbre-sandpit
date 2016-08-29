export function getByKey(array = [], keyValue, key = 'id') {
	return array.reduce((prev, current) => current[key] == keyValue ? current : prev, null);
}

export function getValueById(array = [], keyValue) {
	return getByKey(array, keyValue);
}