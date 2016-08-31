import React, { Component, Children } from 'react'
import PIXI, { Container } from 'pixi.js'

import { getPixelDensity } from '../utils/screenUtils'

export default class PrimaryInterfaceStage extends Component {

	constructor(props) {
		super(props);
		this.instances = {};
		this.stage = new Container();
		this.stage.scale.set(1/getPixelDensity());
		this.stage.pivot.set(0, 0);
		this.stage.interactive = true;
		this.stage.hitArea = new PIXI.Rectangle(0,0,10000,10000);
		this.stage.on('mousemove', event => props.onMouseMove(event));
	}

	render() {
		let usedIds = [];
		Children.forEach(this.props.children, child => {
			if(!child.key) return;
			usedIds.push(child.key);
			const instance = this.instances[child.key];
			if (!instance) {
				const newInstance = child.$$typeof == 'Symbol(react.element)' ? React.createElement(child.type, child.props) : new child.type({...child.props});
				console.log('creating new', child, newInstance);
				this.instances[child.key] = newInstance;
				const result = newInstance.render({...child.props});
				if(result instanceof PIXI.DisplayObject) {
					this.stage.addChild(result);
				}
			}else{
				instance.props = child.props;
				instance.render();
			}
		});

		Object.keys(this.instances).forEach(key => {
			if(usedIds.indexOf(key) < 0) {
				if(this.instanceResults[key] instanceof PIXI.DisplayObject) {
					this.stageWrapper.removeChild(this.instanceResults[key]);
					delete this.instanceResults[key];
					delete this.instances[key];
				}
			}
		});

		return this.stage;
	}
}