import React, { Component } from 'react'
import classname from 'classname'

import noteColors from '../../constants/noteColors'
import { getNotesFromChord } from '../../utils/hookTheoryUtils'

export default class Section extends Component {

	render() {
		const { section, scale, mode } = this.props;
		const { chords, loops } = section || {};
		return (
			<div className="section" onClick={event => this.props.onClick()}>
				{(chords || []).map((chord, i) =>
					<Chord key={i} chord={chord} scale={scale} mode={mode} />
				)}
			</div>
		)
	}

}

class Chord extends Component {

	render() {
		const { chord, scale, mode, playing } = this.props;
		const notes = getNotesFromChord(chord, scale, mode).map(note => (note+scale)%12);
		console.log(chord.loops);
		return (
			<div className={classname('section-chord', playing && 'playing')} style={{width: (chord.loops ? chord.loops+1 : 1)*80}} data-numbered={'x'+((chord.loops || 0)+1)}>
				{notes.map((note, i) => 
					<div key={i} className="chord-note" style={{backgroundColor: '#'+(noteColors[note] || 0xCCC).toString(16)}} />
				)}
			</div>
		)
	}

}