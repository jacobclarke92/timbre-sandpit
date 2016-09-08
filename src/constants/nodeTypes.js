export const ORIGIN_RING_NODE = 'ORIGIN_RING_NODE'
export const ORIGIN_RADAR_NODE = 'ORIGIN_RADAR_NODE'
export const POINT_NODE = 'POINT_NODE'
export const ARC_NODE = 'ARC_NODE'

export const nodeTypeLookup = {
	[ARC_NODE]: 'arcNodes',
	[POINT_NODE]: 'pointNodes',
	[ORIGIN_RING_NODE]: 'originRingNodes',
	[ORIGIN_RADAR_NODE]: 'originRadarNodes',
};

export const nodeTypeKeys = Object.keys(nodeTypeLookup).map(key => nodeTypeLookup[key]);