import $ from 'jquery'
import T from 'timbre'
import sc from 'subcollider'
import PIXI, { Container, Graphics, Sprite, Point } from 'pixi.js'

import noteColors from './constants/note-colors'
import noteStrings from './constants/note-strings'
import modes from './constants/modes'
import * as AnchorTypes from './constants/anchor-types'

const offsetY = 100;

const $modeSelect = $('[data-mode-select]');
const $waveSelect = $('[data-wave-select]');
const $scaleSelect = $('[data-scale-select]');
const $scaleColors = $('[data-scale-colors]');
const $adsr = $('[data-adsr]');
const $container = $('#canvas');


let globalSpeed = 2.5;
let mode =  new sc.Scale.lydian();
let notes = mode.degrees();
let scale = 0;
let wave = 'sin';
let reactive = false;
let showGuides = true;
let guideDivisions = 8;
let guideSubdivisions = 4;
let radialDivisions = 4;
let radialSubdivisions = 3;
const adsr = {
	a: 2,
	h: 100,
	d: 0,
	r: 500,
};

const resolution = window.devicePixelRatio || 1;
let animating = true;
let width = $container.width();
let height = $container.height() - offsetY;
let maxRadius = Math.sqrt(width*width + height*height)/2;
let drawnGuides = false;

let renderer = null;
let canvas = null;
const stage = new Container();
stage.interactive = true;

const guidesGraphic = new Graphics();
stage.addChild(guidesGraphic);

const ripplesGraphic = new Graphics();
stage.addChild(ripplesGraphic);

const clickZone = new Sprite();
clickZone.interactive = true;
clickZone.hitArea = new PIXI.Rectangle(0,0,10000,10000);
stage.addChild(clickZone);

const anchorsContainer = new Container();
stage.addChild(anchorsContainer);


const ripples = [];
const fxRipples = [];
let anchors = [];
let activeAnchor = null;;
let placing = false;
let mouseMoved = false;
let lastScale = 1;

// little id function to not have clashing ids
let idCounter = 0;
function newId() {
	return ++idCounter;
}

// called on init and window resize
function updateSize() {
	width = $container.width();
	height = $container.height();
	maxRadius = Math.sqrt(width*width + height*height)/2;
	drawnGuides = false;
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

function init() {

	// init and bind mode select
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

	// init and bind scale select
	for(let note of noteStrings) {
		const $option = $('<option value="'+note+'">'+note+'</option>');
		if(note == 'C') $option.attr('selected', 'selected');
		$scaleSelect.append($option);
	}
	$scaleSelect.on('change', function() {
		scale = noteStrings.indexOf($(this).val());
		updateModeColors();
	});

	// bind wave select
	$waveSelect.on('change', function() {
		wave = $(this).val();
	});

	$adsr.find('[data-adsr-key]').each((i, elem) => {
		const $elem = $(elem);
		const key = $elem.data('adsr-key');
		$elem.attr('max', 1).attr('step', 0.001);
		$elem.val(adsr[key]/1000);
		$elem.on('change input', function() {
			adsr[key] = $(this).val()*1000;//getSliderLog($(this).val());
		})
	});

	// bind options
	if(reactive) $('[data-reactive]').prop('checked', true);
	$('[data-reactive]').on('change', function() {
		reactive = $(this).prop('checked');
	});
	if(showGuides) $('[data-guides]').prop('checked', true);
	$('[data-guides]').on('change', function() {
		showGuides = $(this).prop('checked');
		drawnGuides = false;
		if(!showGuides) guidesGraphic.clear();
	});
	$('[data-reset]').on('click', function() {
		for(let anchor of anchors) anchorsContainer.removeChild(anchor);
		anchors = [];
	});

	
	// init central ripple
	ripples.push({
		id: newId(),
		x: 0.5,
		y: 0.5,
		radius: 0,
		speed: globalSpeed,
		count: 0,
	});

	// create new anchor node on mouseup
	clickZone.on('mousedown', event => {
		const anchor = new Container();
		const graphic = new Graphics();

		anchor.id = newId();
		anchor.interactive = true;
		anchor.buttonMode = true;
		anchor.type = AnchorTypes.RANDOM;
		anchor.radius = 4;
		anchor.counters = {};
		anchor.scale.set(lastScale);
		anchor.position.set(event.data.originalEvent.clientX, event.data.originalEvent.clientY - offsetY);

		graphic.beginFill(0xFFFFFF);
		graphic.drawCircle(0, 0, anchor.radius);
		anchor.graphic = graphic;
		anchor.addChild(graphic);
		
		anchor.on('mouseover', () => activeAnchor = anchor);
		anchor.on('mouseout', () => {
			if(!placing) activeAnchor = null;
		});
		anchor.on('mousedown', () => {
			activeAnchor = anchor;
			placing = true;
			mouseMoved = false;
		})
		anchor.on('mouseup', function(event) {
			if(placing && !mouseMoved) {
				event.stopPropagation();
				anchorsContainer.removeChild(anchor);
				anchors.splice(anchors.indexOf(anchor), 1);
			}
			placing = false;
			mouseMoved = false;
		});

		anchorsContainer.addChild(anchor);
		anchors.push(anchor);
		placing = true;
		mouseMoved = true;
		activeAnchor = anchor;
	});

	clickZone.on('mousemove', event => {
		if(placing) {
			mouseMoved = true;
			const mouse = new Point(event.data.originalEvent.clientX, event.data.originalEvent.clientY - offsetY);
			const distance = dist(mouse, activeAnchor);
			const angle = Math.atan2(mouse.y - activeAnchor.y, mouse.x - activeAnchor.x);
			if(distance > 20) {
				activeAnchor.rotation = angle;
				if(angle > 0 && angle < Math.PI && activeAnchor.type != AnchorTypes.DOWN) {
					changeAnchorType(activeAnchor, AnchorTypes.DOWN);
				}else if(angle < 0 || angle > Math.PI && activeAnchor.type != AnchorTypes.UP) {
					changeAnchorType(activeAnchor, AnchorTypes.UP);
				}
			}else if(activeAnchor.type != AnchorTypes.RANDOM) {
				changeAnchorType(activeAnchor, AnchorTypes.RANDOM);
			}
		}
	});

	clickZone.on('mouseup', event => {
		if(placing) {
			event.stopPropagation();
			console.log('finished placing');
			activeAnchor = null;
			placing = false;
		}
	})

	// bind window resize to update canvas
	$(window).on('resize', () => {
		updateSize()
		renderer.resize(width, height);
	});

	// bind scrollwheel to sizing anchor nodes
	$(window).on('mousewheel DOMMouseScroll', function(event) {
		if(activeAnchor) {
			const scrollAmount = event.originalEvent.wheelDelta || event.originalEvent.detail;
			if (scrollAmount !== 0) {
				let nextScale = activeAnchor.scale.x - scrollAmount/50;
				nextScale = Math.min(5, Math.max(1, nextScale));
				lastScale = nextScale;
				activeAnchor.scale.set(nextScale);
			}
		}
	});

	// bind document ready to init animation
	$(document).ready(() => {
		updateSize();
		renderer = new PIXI.autoDetectRenderer(width, height, {resolution, transparent: false, backgroundColor: 0x000000});
		canvas = renderer.view;
		$container.append(canvas);
		animate();
	});
}

// gets distance between two points
function dist(p1, p2) {
	return Math.sqrt(
		Math.pow(Math.abs(p2.x-p1.x), 2) + 
		Math.pow(Math.abs(p2.y-p1.y), 2)
	);
}

function changeAnchorType(anchor, type) {
	if(anchor.type == type) return;
	anchor.type = type;
	anchor.graphic.clear();
	let anchorColor = null;
	switch(type) {
		case AnchorTypes.UP: anchorColor = 0x5D8FFF; break;
		case AnchorTypes.DOWN: anchorColor = 0xFF489E; break;
		default: anchorColor = 0xFFFFFF;
	}
	anchor.graphic.beginFill(anchorColor);
	anchor.graphic.drawCircle(0, 0, anchor.radius);
	if(type == AnchorTypes.UP || type == AnchorTypes.DOWN) {
		anchor.graphic.drawPolygon([
			0,-anchor.radius, 
			0, anchor.radius,
			anchor.radius*3, 0,
		])
	}
}

// generates random note that doesn't clash with previous note
let lastNote = 0;
function getRandomNote() {
	console.log('Getting random note');
	let note = notes[Math.floor(Math.random()*notes.length)];
	while(Math.abs(note-lastNote) % 12 <= 1) note = notes[Math.floor(Math.random()*notes.length)];
	lastNote = note;
	return note;
}
function getAscendingNote() {
	console.log('Getting ascending note');
	let index = notes.indexOf(lastNote);
	if(index >= notes.length-1) index = 0;
	else index ++;
	const note = notes[index];
	lastNote = note;
	return note;
}
function getDescendingNote() {
	console.log('Getting descending note');
	let index = notes.indexOf(lastNote);
	if(index === 0) index = notes.length-1;
	else index --;
	const note = notes[index];
	lastNote = note;
	return note;
}

// transforms regular number to log number
function getSliderLog(value, min = 0.00001, max = 1000) {
	const minV = Math.log(min);
	const maxV = Math.log(max);
	return Math.exp(minV + (maxV - minV)*value);
}

// transforms log number to regular number
function getSliderPosition(value, min = 0.00001, max = 1000) {
	const minV = Math.log(min);
	const maxV = Math.log(max);
	return (Math.log(value) - minV) / (maxV - minV);
}

// plays note based on current settings
function playNote(volume = 1, pan = 0, noteType = AnchorTypes.RANDOM) {
	console.log('Playing note');
	let note = null;
	switch(noteType) {
		case AnchorTypes.UP: note = getAscendingNote(); break;
		case AnchorTypes.DOWN: note = getDescendingNote(); break;
		default: note = getRandomNote();
	}
	const freq = mode.degreeToFreq(note, (48+scale).midicps(), 1);
	const synth = T(wave, {freq, mul: volume/10});
	const sound = T('pan', {pos: pan}, synth);
	// const sound = T('reverb', {room:1, damp:0.2, mix:0.7}, synth);
	// const sound = T('delay', {time:250, fb:0.8, mix:0.33}, synth);

	T('adshr', adsr, sound).on('ended', function() {
		this.pause();
		delete this;
	}).bang().play();
	return note;
}

function animate() {

	// draw guides if haven't yet, eg. in init or resize
	if(showGuides && !drawnGuides) {
		let totalDivisions = guideDivisions*guideSubdivisions;
		let radialSegment = maxRadius/totalDivisions;
		guidesGraphic.clear();
		for(let i=0; i<totalDivisions; i++) {
			guidesGraphic.lineStyle(2, (i%guideSubdivisions === 0) ? 0x222222 : 0x111111);
			guidesGraphic.drawCircle(width/2, height/2, i*radialSegment);
		}
		totalDivisions = radialDivisions*radialSubdivisions;
		radialSegment = Math.PI*2/totalDivisions;
		for(let i=0; i<totalDivisions; i++) {
			guidesGraphic.lineStyle(3, 0x111111);
			guidesGraphic.moveTo(width/2, height/2);
			guidesGraphic.lineTo(
				width/2 + Math.cos(i*radialSegment)*maxRadius,
				height/2 + Math.sin(i*radialSegment)*maxRadius
			);
		}
		drawnGuides = true;
	}

	// draw main ripples
	ripplesGraphic.clear();
	ripplesGraphic.lineStyle(3, 0xFFFFFF);
	for(let ripple of ripples) {

		// update ripple radius or reset and increment counter if reached the edge
		ripple.radius += ripple.speed;
		if(ripple.radius > maxRadius) {
			ripple.radius = 0;
			ripple.count ++;
		}else if(ripple.radius <= 0) {
			ripple.radius = maxRadius;
			ripple.count ++;
		}

		// draw ripple
		ripplesGraphic.drawCircle(width*ripple.x, height*ripple.y, ripple.radius);

		// check all anchors to see if ripple has passed over one
		for(let anchor of anchors) {
			if(anchor.counters[ripple.id] != ripple.count
			 && ripple.radius >= dist(new Point(width*ripple.x, height*ripple.y), anchor)) {

			 	// increment anchor counter for ripple so it knows not to trigger next frame
				anchor.counters[ripple.id] = ripple.count;

				// play note
				const note = playNote(
					1*anchor.scale.x, 
					(anchor.x-width/2)/(width/2), 
					anchor.type
				);

				// create an fx ripple
				fxRipples.push({
					id: newId(),
					x: anchor.x,
					y: anchor.y,
					radius: 0,
					speed: globalSpeed/5,
					alpha: 1,
					count: 0,
					parent: anchor.id,
					color: noteColors[note % noteColors.length],
				});

			}
		}
	}

	// draw fx ripples
	for(let ripple of fxRipples) {

		// init fx ripple draw
		ripplesGraphic.lineStyle(4, ripple.color || 0xff8200, ripple.alpha);
		ripple.radius += globalSpeed;
		ripple.alpha -= 0.01;

		// remove ripple if invisible
		if(ripple.alpha <= 0) fxRipples.splice(fxRipples.indexOf(ripple), 1);

		//draw fx ripple
		ripplesGraphic.drawCircle(ripple.x, ripple.y, ripple.radius);

		// if reactive option is checked do the same anchor check as above ripple loop
		if(reactive) {
			for(let anchor of anchors) {
				if(ripple.parent !== anchor.id
				 && !anchor.counters[ripple.id]
				 && ripple.radius >= dist(ripple, anchor)) {
					
					anchor.counters[ripple.id] = ripple.id;

					const note = playNote(
						ripple.alpha*anchor.scale.x, 
						(anchor.x-width/2)/(width/2),
						anchor.type
					);

					fxRipples.push({
						id: newId(),
						x: anchor.x,
						y: anchor.y,
						radius: 0,
						speed: 1,
						count: 0,
						alpha: ripple.alpha/1.5,
						parent: anchor.id,
						color: noteColors[note % noteColors.length],
					});

				}
			}
		}
	}

	// check if animating before approving next frame
	renderer.render(stage);
	if(animating) window.requestAnimationFrame(animate);
}

init();