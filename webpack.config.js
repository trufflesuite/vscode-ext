const webpack = require('webpack');
const CopyPlugin = require('copy-webpack-plugin');
const path = require('path');
const config = {
  target: 'node',
  entry: {
    'extension': './src/extension.ts',
    'debugger': './src/debugger.ts',
  },
  output: {
    path: path.join(__dirname, 'out', 'src'),
    filename: '[name].js',
    libraryTarget: 'commonjs2'
  },
  devtool: false,
  optimization: {
    minimize: true
  },
  externals: function (context, request, callback) {
    // don't pack any require/import that requests any file/module with
    // `"mscorlib"` in it
    if (/mscorlib/i.test(request)) {
      return callback(null, 'commonjs ' + request);
    } else if (/Nethereum/i.test(request)) {
      return callback(null, 'commonjs ' + request);
    // don't pack any require/import that requests `"vscode"`
    } else if (/^vscode$/.test(request)) {
      return callback(null, 'commonjs ' + request);
    } else if (/^electron$/.test(request)) {
      return callback(null, 'require ("' + request + '")');
    }
    callback();
  },
  resolve: {
    // .json is added to prevent import error from /node_modules/got/index.js
    extensions: ['.ts', '.js', '.json'],
    alias: {
      // workaround to require pure js implementation of scrypt.js instead of .node implementation
      // remove and test when https://github.com/trufflesuite/truffle/pull/1852 is brought to release and used
      'scrypt.js': path.resolve('./node_modules/scrypt.js/js.js'),
    },
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        exclude: /node_modules/,
        loader: 'ts-loader',
        options: {
          transpileOnly: true
        }
      }
    ]
  },
  plugins: [
    new CopyPlugin([
      { from: './src/Generators/mscorlib.js', to: './' },
      { from: './src/Generators/Nethereum.Generators.DuoCode.js', to: './' },
      { from: './src/debugger/web3ProviderResolver.js', to: './' },
    ]),
    new webpack.DefinePlugin({
      IS_BUNDLE_TIME: JSON.stringify(true),
    })
  ],
  node: {
    __dirname: false,
  }
};
module.exports = config;