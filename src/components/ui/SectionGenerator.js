import React, { Component } from 'react'
import { connect } from 'react-redux'
import { get } from 'axios'

import newId from '../../utils/newId'
import { playNote } from '../../sound'
import { SPECIFIC } from '../../constants/noteTypes'
import { chordStringToObject, chordObjectToString, getNotesFromChord } from '../../utils/hookTheoryUtils'

import Modal from '../Modal'
import Button from './Button'
import ChordInput from './ChordInput'
import NumberInput from './NumberInput'

const chordDuration = 1000; //ms

class SectionGenerator extends Component {

	static defaultProps = {
		isNew: true,
		section: {chords: [], loops: 0},
	};

	constructor(props) {
		super(props);
		this.state = {
			total: 4,
			random: 2,
			section: props.section,
			chordPlaying: null,
			playing: false,
			loadingChords: false,
		};
	}

	handleSave() {
		this.props.onSave(this.state.section);
		this.props.closeModal();
	}

	fetchChords() {
		const { scale, notes, modeString } = this.props.musicality;
		const { section, total, random } = this.state;
		if(!section.chords.length) return;

		const unsuggestedChords = section.chords.filter(chord => !chord.suggested);
		const path = unsuggestedChords.map(chord => chordObjectToString(chord)).join(',');

		this.setState({loadingChords: true});
		get('/chords/search.json', {params: {path, total, random}})
			.then(response => {
				if(response.status == 200) {
					const responseChords = response.data.data;
					console.log(responseChords);
					const userChords = unsuggestedChords.length;
					const chords = responseChords.map((chord, i) => ({id: newId(true), ...chordStringToObject(chord.chord_ID), suggested: i >= userChords}));
					console.log(chords);
					this.setState({loadingChords: false, section: {...this.state.section, chords}});
				}
			})
			.catch(response => {
				this.setState({loadingChords: false});
				console.log(response);
			});
	}

	handleChordAdd() {
		const { section } = this.state;
		const { modeString } = this.props.musicality;
		const newChord = {id: newId(true), numeral: 1, mode: modeString, loops: 0};
		section.chords = [...section.chords, newChord];
		this.setState({section});
	}

	handleChordChange(oldChord, newChord) {
		const { section } = this.state;
		console.log('Chord change', oldChord, newChord, section.chords.indexOf(oldChord));
		const index = section.chords.indexOf(oldChord);

		// replaces old chord with new chord, also sets any prior chords to not-suggested if new chord isn't
		section.chords = section.chords.map((chord, i) => oldChord.id == chord.id ? newChord : ((!newChord.suggested && i < index) ? {...chord, suggested: false} : chord));
		this.setState({section});
	}

	handleChordRemove(chord) {
		const { section } = this.state;
		section.chords = section.chords.filter(_chord => chord.id != _chord.id);
		this.setState({section});
	}

	playChord(chord) {
		const { scale, modeString } = this.props.musicality;
		const notes = getNotesFromChord(chord, scale, modeString);
		for(let n = 0; n < notes.length; n ++) {
			setTimeout(() => playNote({noteType: SPECIFIC, noteIndex: notes[n]}), n*(200/notes.length));
		}
		this.setState({chordPlaying: chord.id});
		setTimeout(() => {
			if(this.state.chordPlaying == chord.id) this.setState({chordPlaying: null});
		}, chordDuration);
	}

	playAllChords() {
		if(this.state.playing) return;

		const chords = this.state.section.chords || [];
		for(let c = 0; c < chords.length; c ++) {
			setTimeout(() => this.playChord(chords[c]), chordDuration*c);
		}
		this.setState({playing: true});
		setTimeout(() => this.setState({playing: false}), chordDuration*chords.length);
	}

	render() {
		const { isNew } = this.props;
		const { scale, notes, modeString } = this.props.musicality;
		const { section, responseChords, loadingChords, total, random, chordPlaying, playing } = this.state;
		const { chords, loops } = section;

		return (
			<Modal 
				onSave={() => this.handleSave()}
				onClose={() => this.props.closeModal()}
				title={isNew ? 'Add Section' : 'Edit Section'}>

				<NumberInput label="Loops" value={loops} min={0} max={256} onChange={value => this.setState({section: {...section, loops: value}})} />

				<div>
					{chords.map((_chord, i) => {
						const { suggested, locked, ...chord } = _chord;
						return (
							<ChordInput 
								key={i} 
								scale={scale} 
								notes={notes} 
								mode={modeString}
								value={{mode: modeString, ...chord}} 
								locked={locked}
								suggested={suggested}
								playing={chordPlaying == chord.id}
								onPlay={() => this.playChord(chord)}
								onRemove={() => this.handleChordRemove(_chord)}
								onChange={value => this.handleChordChange(_chord, value)} />
						)
					}
					)}
				</div>

				<div className="margin-top-small">
					{chords.length < total && 
						<Button label={chords.length > 0 ? 'Add Next Chord' : 'Add Starter Chord'} icon="add" size="xsmall" selected onClick={() => this.handleChordAdd()} />
					}
					<Button label="Play All" icon="play" size="xsmall" disabled={playing} onClick={() => this.playAllChords()} />
					<Button label="Clear" onClick={() => this.setState({section: {...this.state.section, chords: []} })} />
				</div>

				<div className="margin-top-small">
					<NumberInput label="Total Chords" size="xsmall" value={total} min={2} max={8} onChange={total => this.setState({total})} />
					<NumberInput label="Variation" size="xsmall" min={0} max={50} value={random} onChange={random => this.setState({random})} />
					<Button label="Generate Progression" selected={chords.length > 0} onClick={() => this.fetchChords()} />
				</div>

				<div className="margin-top-small">
					{loadingChords && <span>Loading chords...</span>}
				</div>

			</Modal>
		)
	}

}

export default connect(({musicality}) => ({musicality}))(SectionGenerator)