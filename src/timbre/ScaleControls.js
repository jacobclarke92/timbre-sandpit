import $ from 'jquery'

import noteColors from './constants/noteColors'
import noteStrings from './constants/noteStrings'
import modes from './constants/modes'

const $scaleSelect = $('[data-scale-select]');
const $modeSelect = $('[data-mode-select]');
const $scaleColors = $('[data-scale-colors]');	

const defaultSettings = {
	scale: 'C',
	mode: 'lydian',
};

let mode = null;
let notes = null;
let scale = null;

export function init(_settings = {}) {
	const settings = Object.assign({}, defaultSettings, _settings);

	// init mode options
	for(let mode in modes) {
		const $option = $('<option value="'+mode+'">'+mode+'</option>');
		if(mode == settings['mode']) $option.attr('selected', 'selected');
		$modeSelect.append($option);
	}

	// bind mode events
	$modeSelect.on('change', function() {
		mode = modes[$(this).val()];
		notes = mode.degrees();
		updateModeColors();
	});
	$modeSelect.trigger('change');

	// init scale options
	for(let note of noteStrings) {
		const $option = $('<option value="'+note+'">'+note+'</option>');
		if(note == settings['scale']) $option.attr('selected', 'selected');
		$scaleSelect.append($option);
	}

	// bind scale select
	$scaleSelect.on('change', function() {
		scale = noteStrings.indexOf($(this).val());
		updateModeColors();
	});
}	

// called on mode change
function updateModeColors() {
	$scaleColors.html('');
	for(let note of notes) {
		const noteInScale = (note+scale) % 12;
		const noteColor = noteColors[noteInScale];
		const $block = $('<div class="scale-color">'+noteStrings[noteInScale]+'</div>').css('background-color', '#' + noteColor.toString(16));
		$scaleColors.append($block);
	}
}