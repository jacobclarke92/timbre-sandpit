import React, { Component } from 'react'
import { connect } from 'react-redux'

import { getByKey } from '../utils/arrayUtils'

class MappingsInterface extends Component {
	render() {

		const { fx, desk, lfos, matrix } = this.props;

		return (
			<div className="mappings-interface">
				<table width="800" style={{border: '1px solid black', padding: '10px'}}>
					<thead>
						<tr style={{fontWeight: 'bolder'}}>
							<td>Output</td>
							<td>Out Min</td>
							<td>Out Max</td>
							<td>Input</td>
							<td>Param</td>
							<td>In Min</td>
							<td>In Max</td>
							<td>Map Curve</td>
							<td>Inverted</td>
						</tr>
					</thead>
					<tbody>
						{matrix.map((connection, i) => {
							const outputItem = getByKey(desk, connection.outputOwnerId, 'ownerId');
							const inputItem = getByKey(desk, connection.inputOwnerId, 'ownerId');
							const inputParam = outputItem.dataOutputs[inputItem.ownerId].inputParam;
							return (
								<tr key={i}>
									<td>{outputItem.name}</td>
									<td>{connection.min}</td>
									<td>{connection.max}</td>
									<td>{inputItem.name}</td>
									<td>{inputParam.title}</td>
									<td>{inputParam.min}</td>
									<td>{inputParam.max}</td>
									<td>{connection.mapType}</td>
									<td>{connection.inverted ? 'true' : 'false'}</td>
								</tr>
							)
						})}
					</tbody>
				</table>
			</div>
		)
	}
}

export default connect(({gui, desk, fx, lfos, matrix}) => ({gui, desk, fx, lfos, matrix}))(MappingsInterface)