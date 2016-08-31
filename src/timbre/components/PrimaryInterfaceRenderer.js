import React, { Component, Children } from 'react'
import PIXI, { Container } from 'pixi.js'
import $ from 'jquery'
import deepEqual from 'deep-equal'

import { getPixelDensity } from '../utils/screenUtils'

export default class PrimaryInterfaceRenderer extends Component {

	componentDidMount() {

		this.instances = {};
		this.instanceResults = {};

		this.$container = $(this.refs.container);
		this.handleResize();

		this.renderer = new PIXI.autoDetectRenderer(this.width/getPixelDensity(), this.height/getPixelDensity(), {
			resolution: getPixelDensity(), 
			transparent: false, 
			backgroundColor: 0x000000, 
			antialiasing: true
		});
		this.canvas = this.renderer.view;
		this.$container.append(this.canvas);

		this.stageWrapper = new Container();

		// this.createInstances();
		this.renderFrame();
	}

	handleResize() {
		this.width = this.$container.width();
		this.height = this.$container.height();
		this.offsetY = this.$container.offset().top;
		if(this.renderer) this.renderer.resize(this.width/getPixelDensity(), this.height/getPixelDensity());
	}


	renderFrame() {
		let usedIds = [];
		Children.forEach(this.props.children, child => {
			if(!child.key) return;
			usedIds.push(child.key);
			const instance = this.instances[child.key];
			if (!instance) {
				const newInstance = child.$$typeof == 'Symbol(react.element)' ? React.createElement(child.type, child.props) : new child.type({...child.props});
				console.log('creating new', child, newInstance);
				this.instances[child.key] = newInstance;
				const result = newInstance.render();
				this.instanceResults[child.key] = result;
				if(result instanceof PIXI.DisplayObject) {
					this.stageWrapper.addChild(result);
				}
			}else{
				if(instance.componentWillReceiveProps && !deepEqual(instance.props, child.props)) instance.componentWillReceiveProps(child.props);
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

		this.renderer.render(this.stageWrapper);
		/*if(transport.playing) */requestAnimationFrame(this.renderFrame.bind(this));
	}

	render() {
		return (
			<div className="primary-interface" ref="container"></div>
		)
	}

}