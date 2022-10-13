const webpack = require('webpack');
const CopyPlugin = require('copy-webpack-plugin');
const path = require('path');
const TsconfigPathsPlugin = require('tsconfig-paths-webpack-plugin');

//@ts-check
/** @typedef {import('webpack').Configuration} WebpackConfig **/

/** @type WebpackConfig */
module.exports = {
  target: 'node',
  entry: {
    extension: './src/extension.ts',
  },
  output: {
    path: path.join(__dirname, 'out', 'src'),
    filename: '[name].js',
    libraryTarget: 'commonjs2',
  },
  externals: function ({context, request}, callback) {
    if (/^vscode$/.test(request)) {
      return callback(null, 'commonjs ' + request);
    } else if (/^electron$/.test(request)) {
      return callback(null, 'require ("' + request + '")');
    }
    callback();
  },
  resolve: {
    // .json is added to prevent import error from /node_modules/got/index.js
    alias: {
      'original-require': require.resolve('./polyfills/original-require'),
    },
    extensions: ['.ts', '.js', '.json'],
    plugins: [
      new TsconfigPathsPlugin({
        logInfoToStdOut: true,
      }),
    ],
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        exclude: /node_modules/,
        loader: 'ts-loader',
        options: {
          transpileOnly: true,
        },
      },
    ],
  },
  plugins: [
    new CopyPlugin({
      patterns: [{from: './src/helpers/checkTruffleConfigTemplate.js', to: './'}],
    }),
  ],
  node: {
    __dirname: false,
  },
};
