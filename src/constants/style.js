import leftPad from 'left-pad' // ayy lmao
import lessDefinitions from '../../styles/definitions.less'
import { toCamelCase } from '../utils/stringUtils'
import { getBrightnessFromRgb, hexToRgb } from '../utils/colorUtils'

const styleDefs = {};
Object.keys(lessDefinitions).forEach(key => styleDefs[toCamelCase(key)] = lessDefinitions[key]);

console.log(leftPad('COLOR PALETTE', 31, '~')+leftPad('', 20, '~'));
Object.keys(styleDefs).forEach(key => { 
	if(styleDefs[key].charAt(0) == '#') console.log(
		'%c ' + leftPad(key+' '+styleDefs[key].toUpperCase(), 30) + leftPad('', 20), 
		'color: '+(getBrightnessFromRgb(hexToRgb(styleDefs[key])) > 125 ? 'black' : 'white')+'; background: ' + styleDefs[key]
	); 
});

export default styleDefs;