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

export function inBounds(point, x, y, w, h) {
	return (
		point.x >= x &&
		point.y >= y &&
		point.x <= x + w &&
		point.y <= y + h
	)
}

export function getDistance(pt1, pt2) {
	return Math.sqrt(Math.pow(pt2.x - pt1.x, 2) + Math.pow(pt2.y - pt1.y, 2));
}

export function getAngle(pt1, pt2) {
	return Math.atan2(pt2.y - pt1.y, pt2.x - pt1.x);
}