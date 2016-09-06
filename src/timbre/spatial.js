import { BEAT_PX } from './constants/globals'
import { nodeTypeLookup, ORIGIN_RING_NODE, ORIGIN_RADAR_NODE } from './constants/nodeTypes'

import { checkDifferenceAny } from './utils/lifecycleUtils'
import { getAngle, getDistance, getRadius } from './utils/mathUtils'

let store = null;
let stage = null;
const nearbyPointNodes = {};

export function receiveStore(_store) {
	store = _store;
	store.subscribe(receivedState);
	receivedState();
	updateNearbyPointNodes();
}

function receivedState() {
	const newStage = store.getState().stage;

	// check if length of nodes has changed if so update nearbypoints
	const checks = Object.keys(nodeTypeLookup).map(key => nodeTypeLookup[key]+'.length');
	if(stage && checkDifferenceAny(stage, newStage, checks)) {
		console.log('updating nearby points');
		stage = newStage;
		updateNearbyPointNodes();
		return;
	}

	stage = newStage;
}

export function getClosestNode(point, searchNodes) {
	const nodes = [];
	for(let node of searchNodes) {
		let distance = 0;
		switch(node.nodeType) {
			case ORIGIN_RING_NODE:
			case ORIGIN_RADAR_NODE:
				distance = getDistance(point, node.position);
				if(distance <= getRadius(node)) nodes.push({node, distance});
				break;
		}
	}
	nodes.sort((a,b) => a.distance < b.distance ? -1 : (a.distance > b.distance ? 1 : 0))
	return nodes.length > 0 ? nodes[0] : null;
}

export function getSnapPosition(point, searchNodes = [...stage.originRingNodes, ...stage.originRadarNodes]) {

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

export function getNearbyPointNodes(node) {
	if(!nearbyPointNodes[node.id]) nearbyPointNodes[node.id] = fetchNearbyPointNodes(node);
	return nearbyPointNodes[node.id];
}

export function fetchNearbyPointNodes(node, pointNodes = stage.pointNodes) {
	const nearbyPointNodes = [];
	for(let pointNode of pointNodes) {
		const distance = getDistance(node.position, pointNode.position);
		const angle = getAngle(node.position, pointNode.position) + Math.PI;
		const radius = getRadius(node);
		if(distance <= radius) {
			nearbyPointNodes.push({
				id: pointNode.id,
				node: pointNode,
				distance,
				angle,
			});
		}
	}
	return nearbyPointNodes;
}

export function updateNearbyPointNodes(nodes = [...stage.originRingNodes, ...stage.originRadarNodes]) {
	for(let node of nodes) {
		nearbyPointNodes[node.id] = fetchNearbyPointNodes(node);
	}
}