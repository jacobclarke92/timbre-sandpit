import keycode from 'keycode'

let shiftKeyPressed = false;
let ctrlKeyPressed = false;

export const isShiftKeyPressed = () => shiftKeyPressed;
export const isCtrlKeyPressed = () => ctrlKeyPressed;

function handleKeyDown(event) {
	switch (keycode(event)) {
		case 'shift': shiftKeyPressed = true; break;
		case 'ctrl': ctrlKeyPressed = true; break;
		case 'command': ctrlKeyPressed = true; break;
	}
}

function handleKeyUp(event) {
	switch (keycode(event)) {
		case 'shift': shiftKeyPressed = false; break;
		case 'ctrl': ctrlKeyPressed = false; break;
		case 'command': ctrlKeyPressed = false; break;
	}
}

function init(element = document) {
	element.addEventListener('keydown', handleKeyDown);
	element.addEventListener('keyup', handleKeyUp);
}

init();