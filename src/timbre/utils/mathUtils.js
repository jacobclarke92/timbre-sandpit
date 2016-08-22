 // gets distance between two points
export function dist(p1, p2) {
	return Math.sqrt(
		Math.pow(Math.abs(p2.x-p1.x), 2) + 
		Math.pow(Math.abs(p2.y-p1.y), 2)
	);
}

export function clamp(val, min, max) {
	return Math.min(Math.max(val, min), max);
}