var webpack = require('webpack');
var ExtractTextPlugin = require("extract-text-webpack-plugin");
var config = require('./webpack.config.base.js');

if(config.devtool) delete config.devtool;
config.plugins = [
	new webpack.NoErrorsPlugin(),
	new ExtractTextPlugin('timbre.css', {allChunks: false}),
	new webpack.DefinePlugin({
	    'process.env.NODE_ENV': JSON.stringify('production')
	}),
	new webpack.optimize.UglifyJsPlugin({
		compress: {
			warnings: false
		}
	}),
];

module.exports = config;