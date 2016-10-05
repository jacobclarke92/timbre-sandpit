import React, { Component, Children } from 'react'
import PIXI, { Container } from 'pixi.js'
import deepEqual from 'deep-equal'

import { STAGE_MOVE_SPEED, SCALE_EASE } from '../../constants/globals'
import { getPixelDensity } from '../../utils/screenUtils'
import { checkDifferenceAny } from '../../utils/lifecycleUtils'
import { isUpKeyPressed, isDownKeyPressed, isLeftKeyPressed, isRightKeyPressed } from '../../utils/keyUtils'

export default class InterfaceStage extends Component {

	constructor(props) {
		super(props);
		this.instances = {};
		this.instanceResults = {};
		this.stage = new Container();
		this.stage.scale.set(1/getPixelDensity());
		this.stage.pivot.set(0, 0);
		this.stage.interactive = true;
		this.stage.hitArea = new PIXI.Rectangle(0,0,10000,10000);
		this.stage.on('mousemove', props.onMouseMove);
		this.stage.on('mousedown', props.onPointerDown);
		this.stage.on('touchstart', props.onPointerDown);
		this.stage.on('mouseup', props.onPointerUp);
		this.stage.on('touchend', props.onPointerUp);
	}

	componentWillReceiveProps(nextProps) {
		if(checkDifferenceAny(nextProps.stagePointer, this.props.stagePointer, ['x','y'])) {
			this.stage.position.x += (nextProps.stagePointer.x - this.stage.pivot.x) * this.stage.scale.x;
			this.stage.position.y += (nextProps.stagePointer.y - this.stage.pivot.y) * this.stage.scale.y;
			this.stage.pivot = nextProps.stagePointer;
			if(nextProps.panning) {
				this.stage.position.x += (nextProps.pointer.x - this.props.pointer.x)/getPixelDensity();
				this.stage.position.y += (nextProps.pointer.y - this.props.pointer.y)/getPixelDensity();
			}
		}
	}

	render() {
		let usedIds = [];
		Children.forEach(this.props.children, child => {
			if(!child.key) return;
			usedIds.push(child.key);
			const instance = this.instances[child.key];
			if (!instance) {
				const newInstance = child.$$typeof == 'Symbol(react.element)' ? React.createElement(child.type, child.props) : new child.type({...child.props});
				// console.log('creating new', child, newInstance);
				this.instances[child.key] = newInstance;
				const result = newInstance.render();
				this.instanceResults[child.key] = result;
				if(result instanceof PIXI.DisplayObject) {
					this.stage.addChild(result);
				}
			}else{
				if(instance.componentWillReceiveProps && !deepEqual(instance.props, child.props)) instance.componentWillReceiveProps(child.props);
				instance.props = child.props;
				instance.render();
			}
		});

		Object.keys(this.instances).forEach(key => {
			if(usedIds.indexOf(key) < 0) {
				if(this.instanceResults[key] && this.instanceResults[key] instanceof PIXI.DisplayObject) {
					this.stage.removeChild(this.instanceResults[key]);
					console.log('removing', this.instanceResults[key]);
					delete this.instanceResults[key];
					delete this.instances[key];
				}
			}
		});

		if(isUpKeyPressed()) this.stage.position.y += STAGE_MOVE_SPEED;
		else if(isDownKeyPressed()) this.stage.position.y -= STAGE_MOVE_SPEED;
		if(isLeftKeyPressed()) this.stage.position.x += STAGE_MOVE_SPEED;
		else if(isRightKeyPressed()) this.stage.position.x -= STAGE_MOVE_SPEED;
		this.stage.position = this.props.position;

		const stageScale = this.stage.scale.x;
		this.stage.scale.set(stageScale + (this.props.aimScale - stageScale)/SCALE_EASE);

		return this.stage;
	}
}