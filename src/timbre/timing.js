import Tone, { Transport, Loop } from 'tone'

import { METER_TICKS, BEAT_PX } from './constants/globals'
import { getNearbyPointNodes } from './nodeSpatialUtils'
import * as NodeTypes from './constants/nodeTypes'

const loops = {};
const scheduledNotes = {};

export function createOriginLoop(node) {
	console.log('creating loop for', node);
	const timing = '0:'+(node.bars * node.beats)+':0';
	switch(node.nodeType) {
		case NodeTypes.ORIGIN_RING_NODE:
			loops[node.id] = new Loop(() => scheduleRingNodeNotes(node), timing);
			loops[node.id].playbackRate = node.speed;
			loops[node.id].start(0);
			break
		case NodeTypes.ORIGIN_RADAR_NODE:
			loops[node.id] = new Loop(() => scheduleRadarNodeNotes(node), timing);
			loops[node.id].playbackRate = node.speed;
			loops[node.id].start(0);
			break;
	}
	return loops[node.id];
}

export function cancelLoop(nodeId) {
	if(!loops[nodeId]) return;
	loops[nodeId].cancel();
	loops[nodeId].dispose();
}

export function triggerNote(originNode, node, eventId) {
	console.log('trigger note');
}

// called whenever a note needs to be scheduled
// registers it to the target's scheduledNotes array under the source's id
export function scheduleNote(originNode, node, ticks = Transport.toTicks()) {
	if(!originNode || !node) return;
	const eventId = Transport.scheduleOnce(() => triggerNote(originNode, node, eventId), ticks+'i');
	if(!scheduledNotes[originNode.id]) scheduledNotes[originNode.id] = [];
	scheduledNotes[originNode.id].push(eventId);
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

// clear all scheduled notes originating from a specific source
export function clearScheduledNotesFromSource(source) {
	if(!source) return;
	for(let pointId of Object.keys(scheduledNotes)) {
		for(let sourceId of Object.keys(scheduledNotes[pointId])) {
			if(sourceId == source.id) {
				scheduledNotes[pointId].forEach(noteId => Transport.cancel(noteId));
				scheduledNotes[pointId] = [];
			}
		}
	}
}

// called on node delete of any kind
export function clearScheduledNotes(node) {
	if(!node) return;
	switch(node.nodeType) {
		case NodeTypes.POINT_NODE:
			for(let sourceId of Object.keys(scheduledNotes)) {
				scheduledNotes[sourceId].forEach(noteId => Transport.cancel(noteId));
				scheduledNotes[sourceId] = [];
			}
			break;

		case NodeTypes.ORIGIN_RING_NODE:
		case NodeTypes.ORIGIN_RADAR_NODE:
			clearScheduledNotesFromSource(node.id);
			break;
	}
}