'use strict'

// Import modules
const electron = require('electron')

const app = electron.app
const BrowserWindow = electron.BrowserWindow
let mainWindow = null;

// Load environmental variables
require('dotenv').load();

// const midi = require('midi')
// let midiInput = new midi.input();
// let midiOutput = new midi.output();

if (process.env.NODE_ENV === "development") {
	let hotReloadServer = require('hot-reload-server');
	let webpackConfig = require('../../webpack.config.electron');
	let server = hotReloadServer(webpackConfig, {publicPath: '/dist'});
	server.start()

}

function createWindow() {
	
	/*
	for(let i = 0; i < midiInput.getPortCount(); i ++) {
		console.log('MIDI INPUT '+i+': '+midiInput.getPortName(i));
	}
	for(let i = 0; i < midiOutput.getPortCount(); i ++) {
		console.log('MIDI OUTPUT '+i+': '+midiOutput.getPortName(i));
	}
	*/

	mainWindow = new BrowserWindow({
		width: 1920, 
		height: 1080,
	});
	mainWindow.loadURL(`file://${__dirname}/../index.html`);
	mainWindow.webContents.openDevTools();
	mainWindow.on('closed', function() {
		mainWindow = null;
	});

	mainWindow.webContents.on('did-finish-load', function() {
	    // mainWindow.webContents.executeJavaScript("window.setEnv");
	    mainWindow.webContents.send('init-electron', 'pretty please');
	});

	/*
	ipcMain.on('async-send', (event, arg) => {
		console.log(arg);  // prints "ping"
		event.sender.send('async-reply', arg+' mate!');
	})
	*/

}

app.on('ready', createWindow);

app.on('window-all-closed', function() {
	if (process.platform !== 'darwin') app.quit();
})

app.on('activate', function() {
	if(mainWindow === null) createWindow();
})