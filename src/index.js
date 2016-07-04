import $ from 'jquery'
import T from 'timbre'
import sc from 'subcollider'
import PIXI, { Container, Graphics, Sprite, Point } from 'pixi.js'

const scale =  new sc.Scale.lydian();
// const scale =  new sc.Scale.minorPentatonic();
const notes = scale.degrees();

const $container = $('#canvas');
const resolution = window.devicePixelRatio || 1;
let animating = true;
let width = $(document).width();
let height = $(document).height();
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
		anchor.position.set(event.data.originalEvent.clientX, event.data.originalEvent.clientY);
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

function animate() {

	ripplesGraphic.clear();

	for(let ripple of fxRipples) {
		ripplesGraphic.lineStyle(4, 0xff8200, ripple.alpha);
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

				const note = notes[Math.floor(Math.random()*notes.length)];
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
				});

			}
		}
	}

	renderer.render(stage);
	if(animating) window.requestAnimationFrame(animate);
}

init();