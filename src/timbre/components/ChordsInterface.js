import React, { Component } from 'react'
import { connect } from 'react-redux'
import { get } from 'axios'

import { DISABLE_CHORDS, ENABLE_CHORDS } from '../constants/actionTypes'

import Button from './ui/Button'
import NumberInput from './ui/NumberInput'
import ChordSelect from './ui/ChordSelect'

class ChordsInterface extends Component {

	constructor(props) {
		super(props);
		this.state = { 
			total: 4,
			random: 2,
			selectedChords: [],
			responseChords: [],
			loadingChords: false,
		};
	}

	handleChordSelect(value, index) {
		const selectedChords = this.state.selectedChords;
		selectedChords[index] = value;
		this.setState({selectedChords});
	}

	fetchChords() {
		const { scale, notes } = this.props.musicality;
		const { selectedChords, total, random } = this.state;
		if(!selectedChords.length) return;

		const path = selectedChords.map(note => notes.indexOf(note) + 1).join(',');
		this.setState({loadingChords: true});
		get('/chords/search.json', {params: {path, total, random}})
			.then(response => {
				if(response.status == 200) {
					const responseChords = response.data.data;
					this.setState({loadingChords: false, responseChords});
				}
			})
			.catch(response => {
				this.setState({loadingChords: false});
				console.log(response);
			});
	}

	render() {
		const { scale, notes } = this.props.musicality;
		const { chordsEnabled } = this.props.gui;
		const { selectedChords, loadingChords, responseChords, total, random } = this.state;
		return (
			<div className="chords-interface">
				<Button 
					icon="piano"
					selected={chordsEnabled} 
					label={'Chords '+(chordsEnabled ? 'Enabled' : 'Disabled')} 
					onClick={() => this.props.dispatch({type: chordsEnabled ? DISABLE_CHORDS : ENABLE_CHORDS})} />

				<div className="chord-select">

					<div>
						<NumberInput label="Total Chords" value={total} min={2} max={6} onChange={total => this.setState({total})} />
						<NumberInput label="Variation" min={0} max={50} value={random} onChange={random => this.setState({random})} />
					</div>
					<div>
						{selectedChords.map((chord, i) => 
							<ChordSelect key={i} value={chord} scale={scale} notes={notes} onChange={value => this.handleChordSelect(value, i)} />
						)}
						
						{selectedChords.length < 4 && 
							<ChordSelect 
								scale={scale} 
								notes={notes} 
								label={selectedChords.length ? 'Next Chord' : 'First Chord'} 
								onChange={value => this.handleChordSelect(value, selectedChords.length)} />
						}
					</div>

					<Button label="Generate Progression" onClick={() => this.fetchChords()} />
				</div>
				<div>
					{loadingChords ? (
						<h2>Loading chords...</h2>
					) : (
						<ul>
							{responseChords.map((chord, i) => {
								// const chordId = parseInt(chord.chord_ID);
								return (
									<li key={i}>{chord.chord_ID}</li>
								)
							})}
						</ul>
					)}
				</div>
			</div>
		)
	}

}

export default connect(({gui, musicality}) => ({gui, musicality}))(ChordsInterface)