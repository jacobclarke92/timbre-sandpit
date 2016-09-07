import React, { Component } from 'react'
import { connect } from 'react-redux'
import { get } from 'axios'

import { playNote } from '../sound'
import { SPECIFIC } from '../constants/noteTypes'
import noteStrings from '../constants/noteStrings'
import { modePrefixes } from '../constants/hookTheory'
import { DISABLE_CHORDS, ENABLE_CHORDS } from '../constants/actionTypes'
import { chordStringToObject, getNotesFromChord } from '../utils/hookTheoryUtils'

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
		const { scale, notes, modeString } = this.props.musicality;
		const { selectedChords, total, random } = this.state;
		if(!selectedChords.length) return;

		const modePrefix = modePrefixes[modeString];
		const path = selectedChords.map(note => modePrefix+(notes.indexOf(note) + 1)).join(',');
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

	playChord(notes) {
		for(let note of notes) {
			playNote({noteType: SPECIFIC, noteIndex: note});
		}
	}

	render() {
		const { scale, notes, modeString } = this.props.musicality;
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
						<NumberInput label="Total Chords" value={total} min={2} max={8} onChange={total => this.setState({total})} />
						<NumberInput label="Variation" min={0} max={50} value={random} onChange={random => this.setState({random})} />
					</div>
					<div className="chord-list">

						<label>
							Mode: <b style={{display: 'inline-block', width: 162}}>{modeString.toUpperCase()}</b>
						</label>

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

					<div>
						<Button label="Generate Progression" selected={selectedChords.length > 0} onClick={() => this.fetchChords()} />
						<Button label="Clear" onClick={() => this.setState({selectedChords: []})} />
					</div>
				</div>
				<div>
					{loadingChords ? (
						<span>Loading chords...</span>
					) : (
						<ul>
							{responseChords.map((chord, i) => {
								const chordObj = chordStringToObject(chord.chord_ID);
								const chordNotes = getNotesFromChord(chordObj, scale, modeString);
								const chordNoteToScale = chordNotes.map(note => (note + scale) % 12);
								const chordNoteStrings = chordNoteToScale.map(int => noteStrings[int]);
								return (
									<li key={i}>
										{'Chord ID: '+chord.chord_ID}<br />
										{'Numerials: '+chordNotes.join(', ')}<br />
										{'To scale: '+chordNoteToScale.join(', ')}<br />
										{'Notes: '+chordNoteStrings.join(', ')}<br />
										<Button label="Play" onClick={() => this.playChord(chordNotes)} />
										<pre>{JSON.stringify(chordObj, null, '  ')}</pre>
									</li>
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