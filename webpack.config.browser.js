var webpack = require('webpack');
var BrowserSyncPlugin = require('browser-sync-webpack-plugin');
var config = require('./webpack.config.base.js');

config.plugins.push(
	new BrowserSyncPlugin({
		host: 'localhost',
		port: 3000,
		server: { 
			baseDir: ['./'] ,
			index: 'app/index.html',
		}
	})
);

module.exports = config;