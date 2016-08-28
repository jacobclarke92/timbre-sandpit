import { Loop } from 'tone'
import * as NodeTypes from './constants/nodeTypes'

// called in scope of PrimaryInterface class
export function bindNodeEvents(nodeType, node, attrs = {}) {
	if(!node || !nodeType) return;

	// bind all node hovers with setting hoverNode
	node.on('mouseover', event => this.hoverNode = node);
	node.on('mouseout', event => this.hoverNode = null);
	
	switch(nodeType) {
		case NodeTypes.ORIGIN_RING_NODE:
			node.loop = new Loop(() => this.scheduleRingNodeNotes(node, attrs), '0:'+(attrs.bars * attrs.beats)+':0');
			node.loop.playbackRate = attrs.speed;
			node.loop.start(0);
			break;

		case NodeTypes.ORIGIN_RADAR_NODE:
			node.loop = new Loop(() => this.scheduleRadarNodeNotes(node, attrs), '0:'+(attrs.bars * attrs.beats)+':0');
			node.loop.playbackRate = attrs.speed;
			node.loop.start(0);
			break;
	}
	
	node.on('mousedown', pointNodePointerDown.bind(this));
	node.on('touchstart', pointNodePointerDown.bind(this));
	node.on('mouseup', pointNodePointerUp.bind(this));
	node.on('touchend', pointNodePointerUp.bind(this));
}

export function pointNodePointerDown(event) {
	this.mouseMoved = false;
	this.mouseDown = true;
	this.dragTarget = event.target;
	event.stopPropagation();
}

export function pointNodePointerUp(event) {
	if(event.target) {
		event.stopPropagation();
		if(!this.mouseMoved) {
			this.setActiveNode(event.target);
		}else if(this.dragTarget) {
			this.dragTarget = null;
		}
	}

	this.mouseMoved = false;
	this.mouseDown = false;
}