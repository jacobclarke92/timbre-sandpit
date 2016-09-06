/**
 * References:
 * http://forum.hooktheory.com/t/trends-api-chord-input/272
 * http://forum.hooktheory.com/t/vizualitation-of-all-chord-progressions-kinda/164/4
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

export const appliedSuffixes = {
	'/3': 'over 3',
	'/4': 'over 4',
	'/5': 'over 5',
	'/7': 'over 7',
}

export const inversions = {
	'6': '6',    // <sup>6</sup>			 -- major 6
	'64': '64',	 // <sup>6</sup><sub>4</sub> -- minor 6 ??
	'65': '65',  // augmented ? 
	'42': '42',	 // <sup>4</sup><sub>2</sub>
	'43': '43',  // <sup>4</sup><sub>3</sub>
}

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
 * C164 = i°<sup>6</sup><sub>4</sub>
 * Y6 	= ♭VI
 * 7/5 	= vii°/V
 * 77/5 = vii<sup>ø</sup><sup>7</sup> / V    -- ø = half diminished 7th chord
 * M17	= Ib7
 * D57 	= v<sup>7</sup>
 * D47	= IVb7
 */