import Tone, { Transport, Loop } from 'tone'

import { METER_TICKS, BEAT_PX } from './constants/globals'
import { getNearbyPointNodes } from './nodeSpatialUtils'
import { getValueById } from './utils/arrayUtils'
import { ARC_NODE, POINT_NODE, ORIGIN_RING_NODE, ORIGIN_RADAR_NODE } from './constants/nodeTypes'

/**
 * {
 * 		[sourceNodeId]: loopInstance,
 * 		[sourceNodeId]: loopInstance
 * }
 */
const loops = {};

/**
 * {
 * 		[sourceNodeId]: [
 * 			[nodeId]: scheduleEventId,
 * 			[nodeId]: scheduleEventId,
 * 			[nodeId]: scheduleEventId
 * 		]
 * }
 */
const scheduledNotes = {};

const noteListeners = [];

let store = null;
let stage = null;

export function receiveStore(_store) {
	store = _store;
	store.subscribe(receivedState);
	receivedState();
}

function receivedState() {
	stage = store.getState().stage;
}

export function addNoteListener(func) {
	noteListeners.push(func);
}

export function removeNoteListener(func) {
	const index = noteListeners.indexOf(func);
	if(index >= 0) noteListeners.splice(index, 0);
}

export function cancelLoop(nodeId) {
	if(!loops[nodeId]) return;
	loops[nodeId].cancel();
	loops[nodeId].dispose();
}

export function triggerNote(originNode, node, eventId) {
	console.log('trigger note');
	for(let callback of noteListeners) {
		callback(originNode, node, eventId);
	}
}

export function createOriginLoop(node) {
	console.log('creating loop for', node);
	const timing = '0:'+(node.bars * node.beats)+':0';
	switch(node.nodeType) {
		case ORIGIN_RING_NODE:
			loops[node.id] = new Loop(() => scheduleRingNodeNotes(node), timing);
			loops[node.id].playbackRate = node.speed;
			loops[node.id].start(0);
			break
		case ORIGIN_RADAR_NODE:
			loops[node.id] = new Loop(() => scheduleRadarNodeNotes(node), timing);
			loops[node.id].playbackRate = node.speed;
			loops[node.id].start(0);
			break;
	}
	return loops[node.id];
}

// called whenever a note needs to be scheduled
// registers it to the target's scheduledNotes array under the source's id
export function scheduleNote(originNode, node, ticks = Transport.toTicks()) {
	if(!originNode || !node) return;
	const eventId = Transport.scheduleOnce(() => triggerNote(originNode, node, eventId), ticks+'i');
	if(!scheduledNotes[originNode.id]) scheduledNotes[originNode.id] = {};
	scheduledNotes[originNode.id][node.id] = eventId;
}

// called by every ring node at the beginning of its loop
export function scheduleRingNodeNotes(ringNode) {
	console.log('ring node loop start');
	for(let nearbyPointNode of getNearbyPointNodes(ringNode)) {
		const ticks = ((nearbyPointNode.distance / BEAT_PX) * METER_TICKS) / loops[ringNode.id].playbackRate;
		const triggerTime = Transport.toTicks() + Math.floor(ticks);
		scheduleNote(ringNode, nearbyPointNode.node, triggerTime);
	}
}

// called by every radar node at the beginning of its loop
export function scheduleRadarNodeNotes(radarNode) {
	console.log('radar node loop start');
	for(let nearbyPointNode of getNearbyPointNodes(radarNode)) {
		const totalBeats = radarNode.bars * radarNode.beats;
		const ticks = ((nearbyPointNode.angle / (Math.PI*2)) * totalBeats * METER_TICKS) / loops[radarNode.id].playbackRate;
		const triggerTime = Transport.toTicks() + Math.floor(ticks);
		scheduleNote(radarNode, nearbyPointNode.node, triggerTime);
	}
}

export function checkForNoteReschedule(node) {
	switch(node.nodeType) {
		case ORIGIN_RING_NODE:
		case ORIGIN_RADAR_NODE:
			clearScheduledNotesFromSource(node);
			const nearbyPointNodes = getNearbyPointNodes(node);
			for(let nearbyPointNode of nearbyPointNodes) {
				rescheduleNote(node, nearbyPointNode);
			}
			break;

		case ARC_NODE:
		case POINT_NODE:
			clearScheduledNotesFromTarget(node);
			const originNodes = [...stage.originRingNodes, ...stage.originRadarNodes];
			for(let originNode of originNodes) {
				const nearbyPointNode = getValueById(getNearbyPointNodes(originNode), node.id);
				if(nearbyPointNode) rescheduleNote(originNode, nearbyPointNode);
			}
			break;
	}
}

export function rescheduleNote(originNode, nearbyPointNode) {
	switch(originNode.nodeType) {
		case ORIGIN_RING_NODE:
			console.log('rescheduling ring node note');
			const ringSize = BEAT_PX * (loops[originNode.id].progress * (originNode.bars * originNode.beats));
			if(nearbyPointNode.distance > ringSize) {
				const ticks = Math.floor(((nearbyPointNode.distance - ringSize) / BEAT_PX) * METER_TICKS);
				const triggerTime = Transport.toTicks() + ticks;
				scheduleNote(originNode, nearbyPointNode.node, triggerTime);
			}
			break;

		case ORIGIN_RADAR_NODE:
			console.log('rescheduling radar node note');
			const radarAngle = loops[originNode.id].progress * (Math.PI*2);
			if(nearbyPointNode.angle > radarAngle) {
				const totalBeats = originNode.bars * originNode.beats;
				const ticks = Math.floor(((nearbyPointNode.angle / (Math.PI*2)) * totalBeats * METER_TICKS) / loops[originNode.id].playbackRate);
				const triggerTime = Transport.toTicks() + ticks;
				scheduleNote(originNode, nearbyPointNode.node, triggerTime);
			}
			break;
	}
}

export function removeScheduledNote(sourceId, nodeId, eventId) {
	if(scheduledNotes[sourceId] && scheduledNotes[sourceId][nodeId]) delete scheduledNotes[sourceId][nodeId];
}

// clear all scheduled notes originating from a source node (ring, radar etc.)
export function clearScheduledNotesFromSource(source) {
	if(!source) return;
	for(let sourceId of Object.keys(scheduledNotes)) {
		if(sourceId == source.id) {
			Object.keys(scheduledNotes[sourceId]).forEach(nodeId => Transport.cancel(scheduledNotes[sourceId][nodeId]));
			scheduledNotes[sourceId] = {};
		}
	}
}

// clear all scheduled notes pertaining to a target node (point, arc etc.)
export function clearScheduledNotesFromTarget(node) {
	if(!node) return;
	for(let sourceId of Object.keys(scheduledNotes)) {
		for(let nodeId of Object.keys(scheduledNotes[sourceId])) {
			if(node.id == nodeId) {
				Transport.cancel(scheduledNotes[sourceId][nodeId]);
				delete scheduledNotes[sourceId][nodeId];
			}
		}
	}
}

// called on node delete of any kind
export function clearScheduledNotes(node) {
	if(!node) return;
	switch(node.nodeType) {
		case ARC_NODE:
		case POINT_NODE:
			clearScheduledNotesFromTarget(node);
			break;

		case ORIGIN_RING_NODE:
		case ORIGIN_RADAR_NODE:
			clearScheduledNotesFromSource(node);
			break;
	}
}