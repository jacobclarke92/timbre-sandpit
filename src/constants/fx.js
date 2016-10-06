import * as WaveTypes from './waveTypes'

export const defaultFxParam = {
	min: 0,
	max: 1,
	defaultValue: 0.5,
	step: 0.05,
}

const FX = {
	AutoFilter: {
		title: 'Auto Filter',
		icon: 'ring',
		params: [

		]
	},
	AutoPanner: {
		title: 'Auto Panner',
		icon: 'ring',
		params: [
			{
				key: 'frequency',
				title: 'Frequency',
				description: 'How fast the panner modulates between left and right.',
				defaultValue: 1,
			},{
				key: 'type',
				title: 'Waveform',
				description: '',
				defaultValue: 'sine',
				options: Object.keys(WaveTypes),
			},{
				key: 'depth',
				title: 'Depth',
				description: 'The amount of panning between left and right.',
				defaultValue: 1,
			}/*,{
				key: 'wet',
				title: 'Wet/Dry Mix',
				description: 'The wet control is how much of the effected will pass through to the output.',
				defaultValue: 1,
				min: 0,
				max: 1,
			}*/
		]
	},
	AutoWah: {
		title: 'Auto Wah',
		icon: 'ring',
		params: [
		]
	},
	BitCrusher: {
		title: 'Bitcrusher',
		icon: 'ring',
		params: [
			{
				key: 'bits',
				title: 'Bits',
				description: 'The bit depth of the effect.',
				defaultValue: 4,
				min: 1,
				max: 8,
				step: 1,
			}
		]
	},
	/*
	Chebyshev: {
		title: 'Chebyshev',
		icon: 'ring',
		params: [

		]
	},
	*/
	Chorus: {
		title: 'Chorus',
		icon: 'ring',
		params: [

		]
	},
	/*
	Convolver: {
		title: 'Convolver',
		icon: 'ring',
		params: [

		]
	},
	*/
	Distortion: {
		title: 'Distortion',
		icon: 'ring',
		params: [
			{
				key: 'distortion',
				title: 'Distortion',
				defaultValue: 0.4,
			},{
				key: 'oversample',
				title: 'Oversample',
				defaultValue: 'none',
				options: ['none', '2x', '4x'],
			}
		]
	},
	FeedbackDelay: {
		title: 'Feedback Delay',
		icon: 'ring',
		params: [

		]
	},
	FeedbackEffect: {
		title: 'Feedback Effect',
		icon: 'ring',
		params: [

		]
	},
	Freeverb: {
		title: 'Reverb (Freeverb)',
		icon: 'ring',
		params: [
			{
				key: 'roomSize',
				title: 'Room Size',
				description: 'Correlated to the decay time.',
				defaultValue: 0.7,
			},{
				key: 'dampening',
				title: 'Dampening',
				description: 'The cutoff frequency of a lowpass filter as part of the reverb.',
				defaultValue: 3000,
			}
		]
	},
	JCReverb: {
		title: 'Reverb (JC)',
		icon: 'ring',
		params: [

		]
	},
	MidSideEffect: {
		title: 'Mid-Side Effect',
		icon: 'ring',
		params: [

		]
	},
	Phaser: {
		title: 'Phaser',
		icon: 'ring',
		params: [

		]
	},
	PingPongDelay: {
		title: 'Ping-Pong Delay',
		icon: 'ring',
		params: [

		]
	},
	PitchShift: {
		title: 'Pitch Shift',
		icon: 'ring',
		params: [

		]
	},
	StereoEffect: {
		title: 'Stereo Simulator',
		icon: 'ring',
		params: [

		]
	},
	StereoFeedbackEffect: {
		title: 'Stereo Feedback Effect',
		icon: 'ring',
		params: [

		]
	},
	StereoWidener: {
		title: 'Stereo Widener',
		icon: 'ring',
		params: [
			{
				key: 'width',
				title: 'Width',
				description: '0 = 100% mid. 1 = 100% side. 0.5 = no change.',
			}
		]
	},
	/*
	StereoXFeedbackEffect: {
		title: 'Stereo X Feedback Effect',
		icon: 'ring',
		params: [

		]
	},
	*/
	Tremolo: {
		title: 'Tremolo',
		icon: 'ring',
		params: [

		]
	},
	Vibrato: {
		title: 'Vibrato',
		icon: 'ring',
		params: [

		]
	},
}

// object assign all params with defaultFxParam
Object.keys(FX).forEach(key => FX[key].params = FX[key].params.map(param => ({...defaultFxParam, ...param})))

export default FX