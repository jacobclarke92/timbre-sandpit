import React, { Component, PropTypes } from 'react'
import { connect } from 'react-redux'
import classname from 'classname'
import { Event, Loop } from 'tone'

const beatDisplayTime = 75; //ms

class BeatIndicator extends Component {

	constructor(props) {
		super(props);
		this.beat = -1;
		this.state = {
			indicator: null,
		}
	}

	componentDidMount() {
		this.loop = new Loop(::this.tick, this.props.transport.meterTime+'n');
	}

	componentWillReceiveProps(nextProps) {
		if(nextProps.transport.playing && !this.props.transport.playing) {
			this.beat = -1;
			this.loop.start(0);
		}else if(!nextProps.transport.playing && this.props.transport.playing) {
			this.loop.stop();
		}
	}

	tick() {
		this.beat ++;
		if(this.beat >= this.props.transport.meterBeats || this.beat === 0) {
			this.beat = 0;
			this.setState({indicator: 'downbeat'});
		}else{
			this.setState({indicator: 'upbeat'});
		}
		setTimeout(() => this.setState({indicator: null}), beatDisplayTime);
	}

	render() {
		const { indicator } = this.state;
		return (
			<div className={classname('beat-indicator', indicator)} />
		)
	}

}

export default connect(({transport}) => ({transport}))(BeatIndicator)