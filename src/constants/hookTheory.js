/**
 * References:
 * http://forum.hooktheory.com/t/trends-api-chord-input/272
 * http://forum.hooktheory.com/t/vizualitation-of-all-chord-progressions-kinda/164/4
 * http://musictheoryprof.com/2014/05/how-to-interpret-chord-symbols/
 */

export const modePrefixes = {
	major: '',
	minor: 'B',
	dorian: 'D',
	phrygian: 'Y',
	lydian: 'L',
	mixolydia: 'M',
	aeolian: 'b',
	locrian: 'C',
}

// swap dem key values
export const prefixModes = Object.keys(modePrefixes).reduce((obj, mode) => ({...obj, [modePrefixes[mode]]: mode}), {});

export const inversions = {
	'/3': 'over 3',
	'/4': 'over 4',
	'/5': 'over 5',
	'/7': 'over 7',
}

export const triads = {
	'6': 'major 6',    	// <sup>6</sup>			 -- major 6
	'64': 'diminished',	// <sup>6</sup><sub>4</sub> -- minor 6 ??
	'65': '65',  		// augmented ? 
	'42': '42',	 		// <sup>4</sup><sub>2</sub>
	'43': '43',  		// <sup>4</sup><sub>3</sub>
}

export const triadValues = Object.keys(triads).reduce((obj, key) => ({...obj, [triads[key]]: key}), {});

export const suffixes = {
	'7' : '7', 
}

/**
 * TODO:
 * Work out what these are:
 * b4
 * b5
 * b7    -- apparently is the same as 4/4 (4 over 4)
 * b67
 *
 * 242 	= ii<sup>4</sup><sub>2</sub>
 * C164 = i°<sup>6</sup><sub>4</sub> 		 -- ° = dimished chord
 * Y6 	= ♭VI
 * 7/5 	= vii°/V
 * 77/5 = vii<sup>ø</sup><sup>7</sup> / V    -- ø7 = half diminished 7th chord (maj7 ♭5)
 * 57/3	= V<sup>7</sup>/iii 				 -- 7  = minor 7th
 * M17	= I♭7 								 -- ♭7 = Dominant seventh flat five chord
 * D57 	= v<sup>7</sup>
 * D47	= IVb7
 *  										    °7 = fully-diminished seventh 
 *                								/X = chord inversion where X is the note index that is played lowest
 * 
 */