import * as WaveTypes from '../constants/waveTypes'

// returns array of y co-ords for a wave type given 'size' of x co-ords
export function getWaveLookupArray(waveType, size, phase = 1) {
	const array = new Float32Array(size);
	const piParts = Math.PI*2 / size;
	const ampHalf = 2/size;
	const ampQuarter = 4/size;
	let ampSwitch = 1;
	let amp = 0;
	for(let n = 0; n < size; n++) {
		switch (waveType) {
			case WaveTypes.SINE: 
				array[n] = Math.sin(piParts*n) * phase;
				break;
			case WaveTypes.SQUARE:
				array[n] = Math.sign(Math.sin(piParts*n)) * phase;
				break;
			case WaveTypes.SAWTOOTH:
				if(Math.abs(amp) > 1) amp = -1;
				amp += ampHalf;
				array[n] = amp;
				break;
			case WaveTypes.TRIANGLE:
				if(Math.abs(amp) > 1) ampSwitch = -ampSwitch;
				amp += ampQuarter*ampSwitch;
				array[n] = amp;
				break;
		}
	}

	return array;
}

function getAmplitudeByWaveCycle(waveType, cycle, phase = 1) {
	const theta = cycle * (Math.PI*2);
	let value = 0;
	switch(waveType) {
		case WaveTypes.SINE:
			value = Math.sin(theta);
			break;
		case WaveTypes.SQUARE:
			value = Math.sign(Math.sin(theta));
			break;
		case WaveTypes.TRIANGLE:
			if(cycle < 0.25) value = cycle/0.25;
			else if(cycle < 0.75) value = 1 - ((cycle-0.25)/0.5)*2;
			else value = -1 + (cycle-0.75)/0.25;
			break;
		case WaveTypes.SAWTOOTH:
			if(cycle < 0.5) value = cycle/0.25;
			else value = -1 + (cycle-0.5)/0.5;
			break;
	}
	return value * phase;
}