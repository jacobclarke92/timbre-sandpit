import * as NodeTypes from './constants/nodeTypes'

// called in scope of PrimaryInterface class
export function bindNodeEvents(nodeType, node) {
	if(!node || !nodeType) return;

	// bind all node hovers with setting hoverNode
	node.on('mouseover', event => this.hoverNode = node);
	node.on('mouseout', event => this.hoverNode = null);
	
	switch(nodeType) {
		case NodeTypes.ORIGIN_RING_NODE:
		case NodeTypes.POINT_NODE:
			node.on('mousedown', pointNodePointerDown.bind(this));
			node.on('touchstart', pointNodePointerDown.bind(this));
			node.on('mouseup', pointNodePointerUp.bind(this));
			node.on('touchend', pointNodePointerUp.bind(this));
			break;
	}
}

export function pointNodePointerDown(event) {
	this.mouseMoved = false;
}

export function pointNodePointerUp(event) {
	if(!this.mouseMoved && event.target) {
		event.stopPropagation();
		this.setActiveNode(event.target);
	}

	this.mouseMoved = false;
	this.mouseDown = false;
}