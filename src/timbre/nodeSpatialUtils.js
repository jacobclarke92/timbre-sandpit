import { BEAT_PX } from './constants/globals'
import { ORIGIN_RING_NODE, ORIGIN_RADAR_NODE } from './constants/nodeTypes'

import { getAngle, getDistance } from './utils/mathUtils'

export function getClosestNode(point, searchNodes) {
	const nodes = [];
	for(let node of searchNodes) {
		let distance = 0;
		switch(node.nodeType) {
			case ORIGIN_RING_NODE:
				distance = getDistance(point, node.position);
				if(distance <= node.bars*node.beats*BEAT_PX) nodes.push({node, distance});
				break;
			case ORIGIN_RADAR_NODE:
				distance = getDistance(point, node.position);
				if(distance <= node.radius) nodes.push({node, distance});
				break;
		}
	}
	nodes.sort((a,b) => a.distance < b.distance ? -1 : (a.distance > b.distance ? 1 : 0))
	return nodes.length > 0 ? nodes[0] : null;
}

export function getSnapPosition(point, searchNodes) {
	const closestNode = getClosestNode(point, searchNodes);
	let snapPoint = point;
	if(closestNode) {
		const angle = getAngle(closestNode.node.position, point);
		if(closestNode.node.nodeType == ORIGIN_RING_NODE) {
			const distance = Math.round(closestNode.distance / BEAT_PX) * BEAT_PX - 0.1;
			snapPoint = {
				x: closestNode.node.position.x + Math.cos(angle)*distance,
				y: closestNode.node.position.y + Math.sin(angle)*distance,
			};
		}else if(closestNode.node.nodeType == ORIGIN_RADAR_NODE) {
			const absAngle = angle+Math.PI;
			const anglePart = (Math.PI*2)/(closestNode.node.bars*closestNode.node.beats);
			const angleSnap = Math.round(absAngle / anglePart) * anglePart - Math.PI;
			snapPoint = {
				x: closestNode.node.position.x + Math.cos(angleSnap)*closestNode.distance,
				y: closestNode.node.position.y + Math.sin(angleSnap)*closestNode.distance,
			}
		}
	}else{
		snapPoint = {
			x: Math.round(point.x / BEAT_PX) * BEAT_PX, 
			y: Math.round(point.y / BEAT_PX) * BEAT_PX,
		};
	}
	return snapPoint;
}