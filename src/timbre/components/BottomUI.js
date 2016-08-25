import React, { Component } from 'react'
import { connect } from 'react-redux'
import classname from 'classname'

import { checkDifferenceAny } from '../utils/lifecycleUtils'
import PropertiesUI from './ui/PropertiesUI'

class BottomUI extends Component {

	componentWillReceiveProps(nextProps) {
		if(nextProps.gui.activeNode && checkDifferenceAny(this.props, nextProps, 'gui.activeNode.id')) {
			console.log('selection changed, update properties ui');
		}
	}

	render() {
		const { gui } = this.props;
		const NodeUI = gui.activeNode ? (PropertiesUI[gui.activeNode.nodeType] || null) : null;
		return (
			<div className={classname('ui-properties', gui.activeNode && 'active')}>
				{NodeUI && <NodeUI />}
			</div>
		)
	}
	
}

export default connect(({gui, musicality, transport}) => ({gui, musicality, transport}))(BottomUI)

