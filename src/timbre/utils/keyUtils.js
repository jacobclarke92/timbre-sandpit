import keycode from 'keycode'

let shiftKeyPressed = false;
let ctrlKeyPressed = false;
let leftKeyPressed = false;
let rightKeyPressed = false;
let upKeyPressed = false;
let downKeyPressed = false;

export const isShiftKeyPressed = () => shiftKeyPressed;
export const isCtrlKeyPressed = () => ctrlKeyPressed;
export const isLeftKeyPressed = () => leftKeyPressed;
export const isRightKeyPressed = () => rightKeyPressed;
export const isUpKeyPressed = () => upKeyPressed;
export const isDownKeyPressed = () => downKeyPressed;

const keyCallbacks = {};
const keyUpCallbacks = {};

function handleKeyDown(event) {
	if(isInputFocused()) return;

	const key = keycode(event);
	// console.log(key);
	switch (key) {
		case 'shift': shiftKeyPressed = true; break;
		case 'ctrl': ctrlKeyPressed = true; break;
		case 'command': ctrlKeyPressed = true; break;
	}
	if(key == 'up'/* || key == 'w'*/) upKeyPressed = true;
	if(key == 'down'/* || key == 's'*/) downKeyPressed = true;
	if(key == 'left'/* || key == 'a'*/) leftKeyPressed = true;
	if(key == 'right'/* || key == 'd'*/) rightKeyPressed = true;

	for(let checkKey of Object.keys(keyCallbacks)) {
		if(checkKey == key) {
			for(let callback of keyCallbacks[checkKey]) {
				callback();
			}
		}
	}
}

function handleKeyUp(event) {
	const key = keycode(event);
	switch (key) {
		case 'shift': shiftKeyPressed = false; break;
		case 'ctrl': ctrlKeyPressed = false; break;
		case 'command': ctrlKeyPressed = false; break;
	}
	if(key == 'up') upKeyPressed = false;
	if(key == 'down') downKeyPressed = false;
	if(key == 'left') leftKeyPressed = false;
	if(key == 'right') rightKeyPressed = false;

	for(let checkKey of Object.keys(keyUpCallbacks)) {
		if(checkKey == key) {
			for(let callback of keyUpCallbacks[checkKey]) {
				callback();
			}
		}
	}
}

function handleKeyUp(event) {
	const key = keycode(event);
	switch (key) {
		case 'shift': shiftKeyPressed = false; break;
		case 'ctrl': ctrlKeyPressed = false; break;
		case 'command': ctrlKeyPressed = false; break;
	}
	if(key == 'up') upKeyPressed = false;
	if(key == 'down') downKeyPressed = false;
	if(key == 'left') leftKeyPressed = false;
	if(key == 'right') rightKeyPressed = false;

	for(let checkKey of Object.keys(keyUpCallbacks)) {
		if(checkKey == key) {
			for(let callback of keyUpCallbacks[checkKey]) {
				callback();
			}
		}
	}
}

export function init(element = document) {
	element.addEventListener('keydown', handleKeyDown);
	element.addEventListener('keyup', handleKeyUp);
}

export function addKeyListener(keyCode, func) {
	if(Object.keys(keyCallbacks).indexOf(keyCode) < 0) keyCallbacks[keyCode] = [];
	keyCallbacks[keyCode].push(func);
}

export function removeKeyListener(keyCode, func) {
	if(Object.keys(keyCallbacks).indexOf(keyCode) >= 0) {
		for(let i=0; i<keyCallbacks[keyCode].length; i++) {
			if(keyCallbacks[keyCode][i] == func) keyCallbacks[keyCode].splice(i, 1);
		}
	}
}

export const addKeyDownListener = addKeyListener
export const removeKeyDownListener = removeKeyListener

export function addKeyUpListener(keyCode, func) {
	if(Object.keys(keyUpCallbacks).indexOf(keyCode) < 0) keyUpCallbacks[keyCode] = [];
	keyUpCallbacks[keyCode].push(func);
}

export function removeKeyUpListener(keyCode, func) {
	if(Object.keys(keyUpCallbacks).indexOf(keyCode) >= 0) {
		for(let i=0; i<keyUpCallbacks[keyCode].length; i++) {
			if(keyUpCallbacks[keyCode][i] == func) keyUpCallbacks[keyCode].splice(i, 1);
		}
	}
}

export function isInputFocused() {
	return (document.activeElement && ['INPUT','TEXTAREA'].indexOf(document.activeElement.tagName) >= 0)
}
