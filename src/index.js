import $ from 'jquery'
import T from 'timbre'
import sc from 'subcollider'
import PIXI, { Container, Graphics, Sprite, Point } from 'pixi.js'

import noteColors from './constants/note-colors'
import noteStrings from './constants/note-strings'
import modes from './constants/modes'

const offsetY = 100;

const $modeSelect = $('[data-mode-select]');
const $waveSelect = $('[data-wave-select]');
const $scaleSelect = $('[data-scale-select]');
const $scaleColors = $('[data-scale-colors]');
const $adsr = $('[data-adsr]');
const $container = $('#canvas');


let mode =  new sc.Scale.lydian();
let notes = mode.degrees();
let scale = 0;
let wave = 'sin';
const adsr = {
	a: 80,
	d: 0,
	h: 0,
	r: 500,
};

const resolution = window.devicePixelRatio || 1;
let animating = true;
let width = $container.width();
let height = $container.height() - offsetY;
let maxRadius = Math.sqrt(width*width + height*height)/2;

let renderer = null;
let canvas = null;
const stage = new Container();


const ripplesGraphic = new Graphics();
stage.addChild(ripplesGraphic);

const anchorsContainer = new Container();
stage.addChild(anchorsContainer);

const clickZone = new Sprite();
clickZone.interactive = true;
clickZone.hitArea = new PIXI.Rectangle(0,0,10000,10000);
stage.addChild(clickZone);

const ripples = [];
const fxRipples = [];
const anchors = [];

function updateSize() {
	width = $container.width();
	height = $container.height();
}

function updateModeColors() {
	$scaleColors.html('');
	for(let note of notes) {
		const noteColor = noteColors[(note+scale) % 12];
		const $block = $('<div class="scale-color"></div>').css('background-color', '#' + noteColor.toString(16));
		$scaleColors.append($block);
	}
}

function init() {

	
	for(let mode in modes) {
		const $option = $('<option value="'+mode+'">'+mode+'</option>');
		if(mode == 'lydian') $option.attr('selected', 'selected');
		$modeSelect.append($option);
	}
	$modeSelect.on('change', function() {
		mode = modes[$(this).val()];
		notes = mode.degrees();
		updateModeColors();
	});
	$modeSelect.trigger('change');


	for(let note of noteStrings) {
		const $option = $('<option value="'+note+'">'+note+'</option>');
		if(note == 'C') $option.attr('selected', 'selected');
		$scaleSelect.append($option);
	}
	$scaleSelect.on('change', function() {
		scale = noteStrings.indexOf($(this).val());
		updateModeColors();
	});

	$waveSelect.on('change', function() {
		wave = $(this).val();
	});

	$adsr.find('[data-adsr-key]').each((i, elem) => {
		const $elem = $(elem);
		const key = $elem.data('adsr-key');
		$elem.attr('max', 1).attr('step', 0.001);
		$elem.val(adsr[key]/1000);
		$elem.on('change', function() {
			adsr[key] = $(this).val()*1000;//getSliderLog($(this).val());
		})
	});

	

	ripples.push({
		id: 1,
		x: 0.5,
		y: 0.5,
		radius: 0,
		speed: 5,
		count: 0,
	});

	clickZone.on('mousedown', event => {
		const anchor = new Graphics();
		anchor.beginFill(0x000000);
		anchor.drawCircle(0,0,5);
		anchor.position.set(event.data.originalEvent.clientX, event.data.originalEvent.clientY - offsetY);
		anchor.counters = {};
		anchorsContainer.addChild(anchor);
		anchors.push(anchor);
	});

	$(document).ready(() => {
		updateSize();
		renderer = new PIXI.autoDetectRenderer(width, height, {resolution, transparent: false, backgroundColor: 0xFFFFFF});
		canvas = renderer.view;
		$container.append(canvas);
		animate();
	});

	$(window).on('resize', () => {
		updateSize()
		renderer.resize(width, height);
	});
}

function dist(p1, p2) {
	return Math.sqrt(
		Math.pow(Math.abs(p2.x-p1.x), 2) + 
		Math.pow(Math.abs(p2.y-p1.y), 2)
	);
}

let lastNote = 0;
function getRandomNote() {
	let note = notes[Math.floor(Math.random()*notes.length)];
	while(Math.abs(note-lastNote) % 12 <= 1) note = notes[Math.floor(Math.random()*notes.length)];
	lastNote = note;
	return note;
}

function getSliderLog(value, min = 0.00001, max = 1000) {
	const minV = Math.log(min);
	const maxV = Math.log(max);
	return Math.exp(minV + (maxV - minV)*value);
}
function getSliderPosition(value, min = 0.00001, max = 1000) {
	const minV = Math.log(min);
	const maxV = Math.log(max);
	return (Math.log(value) - minV) / (maxV - minV);
}

function animate() {

	ripplesGraphic.clear();

	for(let ripple of fxRipples) {
		ripplesGraphic.lineStyle(4, ripple.color || 0xff8200, ripple.alpha);
		ripple.radius += 5;
		ripple.alpha -= 0.02;
		if(ripple.alpha <= 0) fxRipples.splice(fxRipples.indexOf(ripple), 1);
		ripplesGraphic.drawCircle(ripple.x, ripple.y, ripple.radius);
	}

	ripplesGraphic.lineStyle(2, 0x000000);
	for(let ripple of ripples) {
		ripple.radius += ripple.speed;
		if(ripple.radius > maxRadius) {
			ripple.radius = 0;
			ripple.count ++;
		}else if(ripple.radius <= 0) {
			ripple.radius = maxRadius;
			ripple.count ++;
		}
		ripplesGraphic.drawCircle(width*ripple.x, height*ripple.y, ripple.radius);

		for(let anchor of anchors) {
			if(anchor.counters[ripple.id] != ripple.count
			 && ripple.radius >= dist(new Point(width*ripple.x, height*ripple.y), anchor)) {
				anchor.counters[ripple.id] = ripple.count;

				const note = getRandomNote();
				const freq = mode.degreeToFreq(note, (48+scale).midicps(), 1);
				const sound = T(wave, {freq, mul: 0.1})
				T('adshr', adsr, sound).on('ended', function() {
					this.pause();
				}).bang().play();

				fxRipples.push({
					x: anchor.x,
					y: anchor.y,
					radius: 0,
					speed: 1,
					alpha: 1,
					color: noteColors[note % noteColors.length],
				});

			}
		}
	}

	renderer.render(stage);
	if(animating) window.requestAnimationFrame(animate);
}

init();