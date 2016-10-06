export function toCamelCase(str) {
	return str.replace(/-([a-z])/g, g => g[1].toUpperCase());
}

export function hexToDec(str = '#FFFFFF') {
	return eval(str.replace('#', '0x'));
}