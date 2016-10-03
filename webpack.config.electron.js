var webpack = require('webpack');
var path = require('path');
var ExtractTextPlugin = require("extract-text-webpack-plugin");
var webpackTargetElectronRenderer = require('webpack-target-electron-renderer');
var config = require('./webpack.config.base.js');

config.entry = [
    'webpack-hot-middleware/client?path=http://localhost:4000/__webpack_hmr&reload=true',
    path.join(__dirname, '/src/index.js'),
];

config.output.publicPath = 'http://localhost:4000/dist/';
config.output.filename = 'timbre.js';

config.plugins = [
	new ExtractTextPlugin('timbre.css', {allChunks: false}),
	new webpack.optimize.OccurenceOrderPlugin(),
	new webpack.HotModuleReplacementPlugin(),
	new webpack.NoErrorsPlugin(),
	new webpack.DefinePlugin({'process.env.NODE_ENV': JSON.stringify('development')}),
];

config.target = webpackTargetElectronRenderer(config);

config.progress = true;

module.exports = config;