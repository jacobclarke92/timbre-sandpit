var path = require('path');
var webpack = require('webpack');
var BrowserSyncPlugin = require('browser-sync-webpack-plugin');

module.exports = {
	entry: {
		timbre: './src/timbre/index.js',
		hooktheory: './src/hooktheory/index.js',
	},
	output: {
		path: path.join(__dirname, 'dist'),
		filename: '[name].js',
	},
	plugins: [
		new webpack.NoErrorsPlugin(),
		new webpack.DefinePlugin({'process.env': {'NODE_ENV': JSON.stringify('production')}}),
		new BrowserSyncPlugin({
			host: 'localhost',
			port: 3000,
			server: { baseDir: ['./'] }
		}),
	],
	resolve: {
		alias: {
			timbre: 'timbre/timbre.dev.js',
		},
	},
	module: {
		loaders: [
			{
				test: /\.js$/,
				include: path.join(__dirname, 'node_modules', 'pixi.js'),
				loader: 'transform?brfs',
			},
			{
				test: /\.json$/,
				include: path.join(__dirname, 'node_modules', 'pixi.js'),
				loader: 'json',
			},
			{
				loader: 'babel-loader',
				test: /\.js$/,
				query: {presets: ['es2015']},
				include: [path.join(__dirname, 'src')],
			},
		],
	}
};
