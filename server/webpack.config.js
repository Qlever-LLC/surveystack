const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');
const nodeExternals = require('webpack-node-externals');
const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');

module.exports = {
  devtool: 'source-map',
	target: 'node',
	entry: './src/index.js',
	module: {
		rules: [
			{
				test: /\.(ts|js)$/,
				use: 'ts-loader?configFile=tsconfig.json',
				exclude: /node_modules/,
			},
		],
	},
	resolve: {
		extensions: ['.ts', '.js'],
	},
	output: {
		filename: 'index.js',
		path: path.resolve(__dirname, 'dist'),
    clean: true,
	},
  externals: [nodeExternals()],
	plugins: [
    new ForkTsCheckerWebpackPlugin(),
		new CopyPlugin({
			patterns: [
        { from: './src/services/mail/assets', to: 'assets' },
			],
		}),
	],
};