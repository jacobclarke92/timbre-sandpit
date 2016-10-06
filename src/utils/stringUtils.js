export function toCamelCase(str) {
	return str.replace(/-([a-z])/g, g => g[1].toUpperCase());
}