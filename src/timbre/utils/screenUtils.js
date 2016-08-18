import $ from 'jquery'
import _debounce from 'lodash/debounce'

let debounce = 100; //ms

const resizeCallbacks = [];
let screenWidth = $(window).width();
let screenHeight = $(window).height();

export function setDebounce(db = 100) {
	debounce = db;
}

export function getPixelDensity() {
	return window.devicePixelRatio || 1;
}

export function addResizeCallback(func) {
	resizeCallbacks.push(func);
}

function _resizeCallback() {
	screenWidth = $(window).width();
	screenHeight = $(window).height();
	for(let callback of resizeCallbacks) {
		callback(screenWidth, screenHeight);
	}
}

const resizeCallback = _debounce(_resizeCallback, 100);
$(window).on('resize', resizeCallback);