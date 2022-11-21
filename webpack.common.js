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
    } else if (/^ganache$/.test(request)) {
      // The Debugger uses `Environment.detect` to set the proper chain Id among other things.
      // However, `@truffle/environment` depends on `ganache` to implement other methods,
      // but it is not used in `detect`.
      // We do not want to include `ganache` in the bundle, since it has two major drawbacks:
      // bundle size and loaders issue related to native code.
      // Thus, setting `ganache` as external allows to exclude it from the bundle.
      // See PR https://github.com/trufflesuite/vscode-ext/pull/261 for more details.    
      return callback(null, 'require ("' + request + '")');
    } else if (/^electron$/.test(request)) {
      return callback(null, 'require ("' + request + '")');
    }
    callback();
  },
  resolve: {
    alias: {
      'original-require': require.resolve('./polyfills/original-require'),
    },
    // .json is added to prevent import error from /node_modules/got/index.js
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
