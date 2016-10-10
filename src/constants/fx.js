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
			{
				key: 'frequency',
				title: 'Frequency',
				description: 'The rate of the LFO',
				defaultValue: 1,
				min: 1,
				max: 10000,
				step: 1,
			},{
				key: 'baseFrequency',
				title: 'Base Frequency',
				description: 'The lower value of the LFOs oscillation',
				defaultValue: 200,
				min: 1,
				max: 10000,
				step: 1,
			},{
				key: 'octaves',
				title: 'Octaves',
				description: 'The number of octaves above the baseFrequency',
				defaultValue: 2.6,
				min: 0,
				max: 10,
				step: 0.2,
			}
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
				min: 1,
				max: 10000,
				step: 1,
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
		params: [{
				key: 'baseFrequency',
				title: 'Base Frequency',
				description: 'The frequency the filter is set to at the low point of the wah',
				defaultValue: 200,
				min: 1,
				max: 10000,
				step: 1,
			},{
				key: 'octaves',
				title: 'Octaves',
				description: 'The number of octaves above the baseFrequency',
				defaultValue: 2.6,
				min: 0,
				max: 10,
				step: 0.2,
			},{
				key: 'sensitivity',
				title: 'Sensitivity',
				description: 'The decibel threshold sensitivity for the incoming signal',
				defaultValue: 0,
				min: -40,
				max: 0,
				step: 0.5,
			}
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
			{
				key: 'frequency',
				title: 'Frequency',
				description: 'The frequency of the LFO',
				defaultValue: 1.5,
				min: 1,
				max: 10000,
				step: 1,
			},
			{
				key: 'delayTime',
				title: 'Delay Time',
				description: 'The delay of the chorus effect in ms',
				defaultValue: 2,
				min: 1,
				max: 50,
				step: 0.5,
			},{
				key: 'depth',
				title: 'Depth',
				description: 'The depth of the chorus',
				defaultValue: 0.7,
			}

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
			{
				key: 'delayTime',
				title: 'Delay Time',
				description: 'The delay applied to the incoming signal',
				defaultValue: 0.25,
			},{
				key: 'feedback',
				title: 'Feedback',
				description: 'The amount of the effected signal which is fed back through the delay',
				defaultValue: 0.5,
			}
		]
	},
	FeedbackEffect: {
		title: 'Feedback Effect',
		icon: 'ring',
		params: [
			{
				key: 'feedback',
				title: 'Feedback',
				description: 'The amount of signal which is fed back into the effect input',
				defaultValue: 0.125,
			}
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
			{
				key: 'delayTime',
				title: 'Delay Time',
				description: 'The delayTime between consecutive echos',
				defaultValue: 0.25,
			},{
				key: 'feedback',
				title: 'Feedback',
				description: 'The amount of feedback from the output back into the input of the effect (routed across left and right channels)',
				defaultValue: 0.2,
			}
		]
	},
	PitchShift: {
		title: 'Pitch Shift',
		icon: 'ring',
		params: [
			{
				key: 'pitch',
				title: 'Pitch',
				description: 'The interval to transpose the incoming signal by',
				defaultValue: 12,
				min: -48,
				max: 48,
				step: 1,
			}
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