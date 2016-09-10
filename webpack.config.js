var path = require('path');
var webpack = require('webpack');
var autoprefixer = require('autoprefixer');
var BrowserSyncPlugin = require('browser-sync-webpack-plugin');
var ExtractTextPlugin = require("extract-text-webpack-plugin");

module.exports = {
	entry: {
		timbre: './src/index.js',
	},
	output: {
		path: path.join(__dirname, 'backend/webroot/dist'),
		filename: '[name].js',
	},
	devtool: 'cheap-module-eval-source-map',
	plugins: [
		new webpack.NoErrorsPlugin(),
		new ExtractTextPlugin('timbre.css', {allChunks: false}),
		new webpack.DefinePlugin({
		    'process.env.NODE_ENV': JSON.stringify('development')
		}),
		new BrowserSyncPlugin({
			host: 'localhost',
			port: 3000,
			server: { 
				baseDir: ['./'] ,
				index: 'app/index.html',
			}
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
				test: /\.less$/,
				include: path.join(__dirname, 'styles'),
				loader: ExtractTextPlugin.extract('style-loader', 'css-loader!postcss-loader!less-loader'),
			},
			{
				test: /\.json$/,
				include: path.join(__dirname, 'node_modules', 'pixi.js'),
				loader: 'json',
			},
			{
				loader: 'babel-loader',
				test: /\.js$/,
				query: {presets: ['react', 'es2015', 'stage-0']},
				include: [path.join(__dirname, 'src')],
			},
		],
	},
	postcss: [ autoprefixer({ browsers: ['last 3 versions'] }) ],
};
