import { modePrefixes, appliedSuffixes, inversions, suffixes } from '../constants/hookTheory'

const minorNumerals = [2,3,6];
const modePrefixKeys = Object.keys(modePrefixes);

export function chordStringToObject(str, scale) {
	if(typeof str != 'string') str = str.toString();

	const chord = {};
	if(modePrefixKeys.indexOf(str.charAt(0)) >= 0) {
		chord.mode = modePrefixes[str.charAt(0)];
		str = str.substring(1);
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