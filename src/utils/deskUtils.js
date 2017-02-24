import { getByKey } from './arrayUtils'

export function getDeskWires(desk) {
	if(!desk) return;
	const connections = [];
	for(let fromItem of desk) {
		if(fromItem.audioOutput) Object.keys(fromItem.audioOutputs).forEach(outputId => {
			const wire = fromItem.audioOutputs[outputId];
			const toItem = getByKey(desk, outputId, 'ownerId');
			if(toItem) connections.push({
				type: 'audio',
				id: fromItem.ownerId+'___'+toItem.ownerId,
				from: {x: fromItem.position.x + wire.outputPosition.x, y: fromItem.position.y + wire.outputPosition.y},
				to: {x: toItem.position.x + wire.inputPosition.x, y: toItem.position.y + wire.inputPosition.y},
				outputOwnerId: fromItem.ownerId,
				inputOwnerId: toItem.ownerId,
			});
		});
		if(fromItem.dataOutput) Object.keys(fromItem.dataOutputs).forEach(outputId => {
			const wire = fromItem.dataOutputs[outputId];
			const toItem = getByKey(desk, outputId, 'ownerId');
			if(toItem) connections.push({
				type: 'data',
				id: fromItem.ownerId+'___'+toItem.ownerId,
				from: {x: fromItem.position.x + wire.outputPosition.x, y: fromItem.position.y + wire.outputPosition.y},
				to: {x: toItem.position.x + wire.inputPosition.x, y: toItem.position.y + wire.inputPosition.y},
				outputOwnerId: fromItem.ownerId,
				inputOwnerId: toItem.ownerId,
				inputParamKey: wire.inputParam.key,
			});
		});
	}
	return connections;
}