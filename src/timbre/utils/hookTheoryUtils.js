import modes from '../constants/modes'
import { prefixModes, modePrefixes, inversions, triads, triadValues, suffixes } from '../constants/hookTheory'

const minorNumerals = [2,3,6];
const triadKeys = Object.keys(triads);
const prefixModeKeys = Object.keys(prefixModes);

export function chordStringToObject(str) {
	if(typeof str != 'string') str = str.toString();

	const chord = {};
	
	// check for mode character (always at beginning)
	if(prefixModeKeys.indexOf(str.charAt(0)) >= 0) {
		chord.mode = prefixModes[str.charAt(0)];
		str = str.substring(1);
	}

	// extract chord inversion if it has one e.g /3 /4 /5 /7
	const inversions = str.split('/');
	if(inversions.length > 1) {
		chord.inversion = parseInt(inversions[1]);
		str = inversions[0];
	}

	// check for a 7th don't know how major 7ths are formatted though seems like it's left up to the mode
	if(str.length > 1 && str.charAt(str.length-1) == '7') {
		chord.seventh = true;
		str = str.slice(0, -1);
	}

	if(str.length > 1) {
		const triad = str.substring(1, str.length);
		const triadIndex = triadKeys.indexOf(triad);
		// console.log(triad, triadIndex, triadIndex >= 0 ? triads[triad] : '');
		if(triadIndex >= 0) chord.triad = triads[triad];
		str = str.charAt(0);
	} 

	if(str.length == 1) {
		const int = parseInt(str);
		chord.numeral = int;
		chord.type = (minorNumerals.indexOf(int) >= 0) ? 'minor' : 'major';
	}
	//etc etc....

	return chord;
}

export function chordObjectToString(chord, scale) {
	const { mode, numeral, triad, seventh, inversion } = chord;
	let string = '';

	if(mode && modePrefixes[mode]) string += modePrefixes[mode];
	if(numeral) string += numeral;
	if(triad) string += triadValues[triad];
	if(seventh) string += '7';
	if(inversion) string += '/'+inversion;

	return string;
}

export function getNotesFromChord(chord, key = 0, mode) {
	const modeNotes = (chord.mode && modes[chord.mode]) ? modes[chord.mode].degrees() : modes[mode].degrees();
	const notes = [];
	const numeral = chord.numeral - 1;

	notes.push(modeNotes[(numeral + 0) % 7]);
	notes.push(modeNotes[(numeral + 2) % 7]);
	notes.push(modeNotes[(numeral + 4) % 7]);

	if(chord.triad) switch(chord.triad) {
		case 'major 6': notes.push(modeNotes[(numeral + 5) % 7]); break;
		case 'diminished':
			notes[1] = (notes[1] - 1) % 12;
			notes[2] = (notes[2] - 1) % 12;
			if(notes[1] < 0) notes[1] = 11;
			if(notes[2] < 0) notes[2] = 11;
			break;
	}

	if(chord.seventh) notes.push(modeNotes[(numeral + 6) % 7]);

	// if(chord.inversion) // do something

	return notes;
}