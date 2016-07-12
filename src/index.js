import $ from 'jquery'
import T from 'timbre'
import sc from 'subcollider'
import PIXI, { Container, Graphics, Sprite, Point } from 'pixi.js'

import noteColors from './constants/note-colors'

const scales = {
	major: new sc.Scale.major(),
	minor: new sc.Scale.major(),
	whole: new sc.Scale.whole(),
	
	augmented: new sc.Scale.augmented(),
	augmented2: new sc.Scale.augmented2(),
	ionian: new sc.Scale.ionian(),
	dorian: new sc.Scale.dorian(),
	phrygian: new sc.Scale.phrygian(),
	lydian: new sc.Scale.lydian(),
	mixolydian: new sc.Scale.mixolydian(),
	aeolian: new sc.Scale.aeolian(),
	locrian: new sc.Scale.locrian(),
	harmonicMinor: new sc.Scale.harmonicMinor(),
	harmonicMajor: new sc.Scale.harmonicMajor(),
	melodicMinor: new sc.Scale.melodicMinor(),
	melodicMinorDesc: new sc.Scale.melodicMinorDesc(),
	melodicMajor: new sc.Scale.melodicMajor(),
	minorPentatonic: new sc.Scale.minorPentatonic(),
	majorPentatonic: new sc.Scale.majorPentatonic(),
	
	hexMajor7: new sc.Scale.hexMajor7(),
	hexDorian: new sc.Scale.hexDorian(),
	hexPhrygian: new sc.Scale.hexPhrygian(),
	hexSus: new sc.Scale.hexSus(),
	hexMajor6: new sc.Scale.hexMajor6(),
	hexAeolian: new sc.Scale.hexAeolian(),

	ritusen: new sc.Scale.ritusen(),
	egyptian: new sc.Scale.egyptian(),
	hirajoshi: new sc.Scale.hirajoshi(),
	kumoi: new sc.Scale.kumoi(),
	iwato: new sc.Scale.iwato(),
	ryukyu: new sc.Scale.ryukyu(),
	chinese: new sc.Scale.chinese(),
	indian: new sc.Scale.indian(),
	pelog: new sc.Scale.pelog(),
	prometheus: new sc.Scale.prometheus(),
	scriabin: new sc.Scale.scriabin(),
	gong: new sc.Scale.gong(),
	shang: new sc.Scale.shang(),
	jiao: new sc.Scale.jiao(),
	zhi: new sc.Scale.zhi(),
	yu: new sc.Scale.yu(),
	

}

const offsetY = 80;

let scale =  new sc.Scale.lydian();
let notes = scale.degrees();

const $mode = $('[data-mode-select]');
const $scaleColors = $('[data-scale-colors]');
const $container = $('#canvas');

const resolution = window.devicePixelRatio || 1;
let animating = true;
let width = $(document).width();
let height = $(document).height() - offsetY;
let maxRadius = Math.sqrt(width*width + height*height)/2;

const renderer = new PIXI.autoDetectRenderer(width, height, {resolution, transparent: false, backgroundColor: 0xFFFFFF});
const canvas = renderer.view;
const stage = new Container();


const ripplesGraphic = new Graphics();
stage.addChild(ripplesGraphic);

const anchorsContainer = new Container();
stage.addChild(anchorsContainer);

const clickZone = new Sprite();
clickZone.interactive = true;
clickZone.hitArea = new PIXI.Rectangle(0,0,width,height);
stage.addChild(clickZone);

const ripples = [];
const fxRipples = [];
const anchors = [];

function init() {

	
	$mode.append('<option>Select scale...</option>');
	for(let scale in scales) {
		const $option = $('<option value="'+scale+'">'+scale+'</option>');
		if(scale == 'lydian') $option.attr('selected', 'selected');
		$mode.append($option);
	}
	$mode.on('change', function() {
		scale = scales[$(this).val()];
		notes = scale.degrees();
		$scaleColors.html('');
		for(let note of notes) {
			const $block = $('<div class="scale-color"></div>').css('background-color', '#' + noteColors[note].toString(16));
			$scaleColors.append($block);
		}
	});
	$mode.trigger('change');
		
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

	$container.append(canvas);

	animate();
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
				const freq = scale.degreeToFreq(note, (48).midicps(), 1);
				const sine = T('sin', {freq, mul: 0.1})
				T('perc', {a:80, r:500}, sine).on('ended', function() {
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