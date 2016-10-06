var path = require('path');
var webpack = require('webpack');
var autoprefixer = require('autoprefixer');
var ExtractTextPlugin = require("extract-text-webpack-plugin");

var options = {
	entry: {
		'timbre': path.join(__dirname, '/src/index.js'),
	},
	output: {
		filename: '[name].js',
		path: path.join(__dirname, '/backend/webroot/dist'),
	},
	devtool: 'cheap-module-eval-source-map',
	plugins: [
		new webpack.NoErrorsPlugin(),
		new ExtractTextPlugin('timbre.css', {allChunks: false}),
		new webpack.DefinePlugin({
		    'process.env.NODE_ENV': JSON.stringify('development')
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
				test: /index\.less$/,
				include: path.join(__dirname, 'styles'),
				loader: ExtractTextPlugin.extract('style-loader', 'css-loader!postcss-loader!less-loader'),
			},
			{
				test: /definitions\.less$/,
				include: path.join(__dirname, 'styles'),
				loader: 'less-vars',
			},
			{
				test: /\.json$/,
				include: [
					path.join(__dirname, 'node_modules', 'pixi.js'),
					path.join(__dirname, 'node_modules', 'axios'),
				],
				loader: 'json',
			},
			{
				loader: 'babel-loader',
				test: /\.js$/,
				query: {presets: ['react', 'es2015', 'stage-0']},
				include: [
					path.join(__dirname, 'src'), 
					path.join(__dirname, 'app/src'),
				],
			},
		],
	},
	postcss: [ autoprefixer({ browsers: ['last 3 versions'] }) ],
};

module.exports = options;
