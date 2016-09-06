import { modePrefixes, appliedPrefixes, inversions } from '../constants/hookTheory'

const minorNumerals = [2,3,6];

export function chordStringToObject(str, scale) {
	if(typeof str != 'string') str = str.toString();

	const chord = {};
	if(str.length == 1) {
		chord.numeral = parseInt(str);
		chord.minor = minorNumerals.indexOf(parseInt(str)) >= 0;
	}
	//etc etc....

	return chord;
}