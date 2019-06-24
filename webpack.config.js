const CopyPlugin = require('copy-webpack-plugin');
const path = require('path');
const config = {
  target: 'node',
  entry: './src/extension.ts',
  output: {
    path: path.join(__dirname, 'out', 'src'),
    filename: 'extension.js',
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
    }
    callback();
  },
  resolve: {
    extensions: ['.ts', '.js']
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
    ]),
  ],
};
module.exports = config;