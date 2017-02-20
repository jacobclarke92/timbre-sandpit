import React, { Component } from 'react'
import { connect } from 'react-redux'

import { getByKey } from '../utils/arrayUtils'
import { getDeskMappings } from '../utils/deskUtils'

class MappingsInterface extends Component {
	render() {

		const { fx, desk, lfos } = this.props;
		const connections = getDeskMappings(desk);

		return (
			<div className="mappings-interface">
				{Object.keys(connections).map(source => {
					const deskItem = getByKey(desk, source, 'ownerId');
					const effect = getByKey(fx, source);
					return (
						<div key={source} style={{border: '1px solid black', padding: '10px'}}>
							<b>{deskItem.name + ' (' + effect.type + ')'}</b>
							<table width="600">
							<thead>
								<tr>
									<td>Param</td>
									<td>Value</td>
									<td>Osc</td>
									<td>Osc Type</td>
								</tr>
							</thead>
							<tbody>
								{Object.keys(connections[source]).map(param => {
									const lfo = getByKey(lfos, connections[source][param].lfo);
									return (
										<tr key={param}>
											<td>{param}</td>
											<td>{effect.params[param]}</td>
											<td>{lfo.id}</td>
											<td>{lfo.waveform}</td>
										</tr>
									)
								})}
							</tbody>
							</table>
						</div>
					)
				})}
			</div>
		)
	}
}

export default connect(({gui, desk, fx, lfos}) => ({gui, desk, fx, lfos}))(MappingsInterface)