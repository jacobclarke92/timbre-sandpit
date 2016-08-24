import * as WaveTypes from '../constants/waveTypes'

export function getWaveLookupArray(waveType, size, phase = 1) {
	const array = new Float32Array(size);
	const piParts = Math.PI*2 / size;
	const half = Math.floor(size/2);
	for(let n = 0; n < size; n++) {
		switch (waveType) {
			case WaveTypes.SINE: 
				array[n] = Math.sin(piParts*n) * phase;
				break;
			case WaveTypes.SQUARE:
				array[n] = Math.sign(Math.sin(piParts*n)) * phase;
				break;
			case WaveTypes.SAWTOOTH:
				array[n] = (-1 + n/size*2) * phase;
				break;
			case WaveTypes.TRIANGLE:
				array[n] = (n < size/2 ? (-1 + n*2/size*2) : (1 - (n-half)*2/size*2)) * phase;
				break;
		}
	}

	return array;
}