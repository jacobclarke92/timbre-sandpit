import React, { Component, Children } from 'react'
import PIXI, { Container } from 'pixi.js'
import $ from 'jquery'
import deepEqual from 'deep-equal'

import { getPixelDensity } from '../../utils/screenUtils'

let raf = null;

export default class DeskInterfaceRenderer extends Component {

	static defaultProps = {
		playing: true,
		backgroundColor: 0xFF0000,
	};

	componentDidMount() {

		this.instances = {};
		this.instanceResults = {};

		this.$container = $(this.refs.container);

		this.renderer = new PIXI.autoDetectRenderer(this.props.width/getPixelDensity(), this.props.height/getPixelDensity(), {
			resolution: getPixelDensity(), 
			transparent: false, 
			backgroundColor: this.props.backgroundColor, 
			antialiasing: true
		});
		this.canvas = this.renderer.view;
		this.$container.append(this.canvas);

		this.stageWrapper = new Container();

		// this.createInstances();
		this.renderFrame();
	}

	componentWillUnmount() {
		cancelAnimationFrame(raf);
		this.renderer.destroy();
	}

	componentWillReceiveProps(nextProps) {
		if(nextProps.width != this.props.width || nextProps.height != this.props.height) {
			this.renderer.resize(nextProps.width/getPixelDensity(), nextProps.height/getPixelDensity());
		}
		if(nextProps.playing && !this.props.playing) {
			setTimeout(() => this.renderFrame());
		}
	}

	renderFrame() {
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
				if(this.instanceResults[key] && this.instanceResults[key] instanceof PIXI.DisplayObject) {
					this.stageWrapper.removeChild(this.instanceResults[key]);
					delete this.instanceResults[key];
					delete this.instances[key];
				}
			}
		});

		this.renderer.render(this.stageWrapper);
		if(this.props.playing) raf = requestAnimationFrame(this.renderFrame.bind(this));
	}

	render() {
		return (
			<div className="fx-interface" ref="container"></div>
		)
	}

}