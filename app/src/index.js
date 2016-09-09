import electron, { app, BrowserWindow } from 'electron'
import midi from 'midi'

let mainWindow;
let midiInput = new midi.input();
let midiOutput = new midi.output();

function createWindow() {
	
	for(let i = 0; i < midiInput.getPortCount(); i ++) {
		console.log('MIDI INPUT '+i+': '+midiInput.getPortName(i));
	}
	for(let i = 0; i < midiOutput.getPortCount(); i ++) {
		console.log('MIDI OUTPUT '+i+': '+midiOutput.getPortName(i));
	}

	mainWindow = new BrowserWindow({width: 1920, height: 1080});
	mainWindow.loadURL(`file://${__dirname}/../index.html`);
	mainWindow.webContents.openDevTools();
	mainWindow.on('closed', () => {
		mainWindow = null;
	});
}

app.on('ready', createWindow);

app.on('window-all-closed', () => {
	if (process.platform !== 'darwin') app.quit();
})

app.on('activate', () => {
	if(mainWindow === null) createWindow();
})