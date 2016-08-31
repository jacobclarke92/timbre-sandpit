import Tone, { Transport, Loop } from 'tone'

import { METER_TICKS, BEAT_PX } from './constants/globals'
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

// called whenever a note needs to be scheduled
// registers it to the target's scheduledNotes array under the source's id
export function scheduleNote(originNode, nodeInstance, ticks = Transport.toTicks()) {
	if(!originNode || !nodeInstance) return;
	const eventId = Transport.scheduleOnce(() => this.triggerNote(originNode, nodeInstance, eventId), ticks+'i');
	if(!nodeInstance.scheduledNotes[originNode.id]) nodeInstance.scheduledNotes[originNode.id] = [];
	nodeInstance.scheduledNotes[originNode.id].push(eventId);
}

// called by every ring node at the beginning of its loop
export function scheduleRingNodeNotes(ringNodeInstance, ringNode) {
	console.log('ring node loop start');
	/*
	if(!ringNodeInstance.nearbyPointNodes) this.getNearbyPointNodes(ringNodeInstance);
	for(let nearbyPointNode of ringNodeInstance.nearbyPointNodes) {
		const ticks = ((nearbyPointNode.distance / BEAT_PX) * METER_TICKS)/ringNodeInstance.loop.playbackRate;
		const triggerTime = Transport.toTicks() + Math.floor(ticks);
		this.scheduleNote(ringNode, nearbyPointNode.ref, triggerTime);
	}
	*/
}

// called by every radar node at the beginning of its loop
export function scheduleRadarNodeNotes(radarNodeInstance, radarNode) {
	/*
	if(!radarNodeInstance.nearbyPointNodes) this.getNearbyPointNodes(radarNodeInstance);
	for(let nearbyPointNode of radarNodeInstance.nearbyPointNodes) {
		const totalBeats = radarNode.bars * radarNode.beats;
		const ticks = ((nearbyPointNode.angle / (Math.PI*2)) * totalBeats * METER_TICKS) / radarNodeInstance.loop.playbackRate;
		const triggerTime = Transport.toTicks() + Math.floor(ticks);
		this.scheduleNote(radarNode, nearbyPointNode.ref, triggerTime);
	}
	*/
}