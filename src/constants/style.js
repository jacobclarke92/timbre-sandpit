import lessDefinitions from '../../styles/definitions.less'
import { toCamelCase } from '../utils/stringUtils'

const styleDefs = {};
Object.keys(lessDefinitions).forEach(key => styleDefs[toCamelCase(key)] = lessDefinitions[key]);
console.log(lessDefinitions, styleDefs);

export default styleDefs;