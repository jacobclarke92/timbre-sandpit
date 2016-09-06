import React, { Component, Children } from 'react'
import PIXI, { Container } from 'pixi.js'
import deepEqual from 'deep-equal'

export default class FXContainer extends Component {

	constructor(props) {
		super(props);
		this.instances = {};
		this.instanceResults = {};
		this.container = new Container();
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
					this.container.addChild(result);
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
					this.container.removeChild(this.instanceResults[key]);
					// console.log('removing', this.instanceResults[key]);
					delete this.instanceResults[key];
					delete this.instances[key];
				}
			}
		});

		return this.container;
	}
}