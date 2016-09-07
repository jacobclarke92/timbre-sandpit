import { prefixModes, inversions, triads, suffixes } from '../constants/hookTheory'

const minorNumerals = [2,3,6];
const prefixModeKeys = Object.keys(prefixModes);

export function chordStringToObject(str, scale) {
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
		switch(str.substring(1, str.length)) {
			case '6': chord.triad = 'major 6'; break;
			case '64': chord.triad = 'diminished'; break;
			case '65': chord.triad = '65 - unknown'; break;
		}
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

export function getNotesFromChord(chord, key = 0) {

}