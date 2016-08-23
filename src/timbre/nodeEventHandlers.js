import * as NodeTypes from './constants/nodeTypes'

// called in scope of PrimaryInterface class
export function bindNodeEvents(nodeType, node) {
	if(!node || !nodeType) return;

	// bind all node hovers with setting activeNode
	node.on('mouseover', event => this.activeNode = node);
	node.on('mouseout', event => this.activeNode = null);
	
	switch(nodeType) {
		case NodeTypes.POINT_NODE:
			node.on('mousedown', pointNodePointerDown.bind(this));
			node.on('touchstart', pointNodePointerDown.bind(this));
			node.on('mouseup', pointNodePointerUp.bind(this));
			node.on('touchend', pointNodePointerUp.bind(this));
			break;
	}
}

export function pointNodePointerDown(event) {
	this.placing = true;
	this.mouseMoved = false;
}

export function pointNodePointerUp(event) {
	// if pointer hasn't moved since pointer down then remove
	if(this.placing && !this.mouseMoved && event.target) {
		event.stopPropagation();
		this.removeNode(event.target);
	}

	this.placing = false;
	this.mouseMoved = false;
	this.mouseDown = false;
}