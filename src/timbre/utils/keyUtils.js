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

function handleKeyDown(event) {
	const key = keycode(event);
	switch (key) {
		case 'shift': shiftKeyPressed = true; break;
		case 'ctrl': ctrlKeyPressed = true; break;
		case 'command': ctrlKeyPressed = true; break;
	}
	if(key == 'up' || key == 'w') upKeyPressed = true;
	if(key == 'down' || key == 's') downKeyPressed = true;
	if(key == 'left' || key == 'a') leftKeyPressed = true;
	if(key == 'right' || key == 'd') rightKeyPressed = true;
}

function handleKeyUp(event) {
	const key = keycode(event);
	switch (key) {
		case 'shift': shiftKeyPressed = false; break;
		case 'ctrl': ctrlKeyPressed = false; break;
		case 'command': ctrlKeyPressed = false; break;
	}
	if(key == 'up' || key == 'w') upKeyPressed = false;
	if(key == 'down' || key == 's') downKeyPressed = false;
	if(key == 'left' || key == 'a') leftKeyPressed = false;
	if(key == 'right' || key == 'd') rightKeyPressed = false;
}

export function init(element = document) {
	element.addEventListener('keydown', handleKeyDown);
	element.addEventListener('keyup', handleKeyUp);
}