const path = require('path');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const ReplacePlugin = require('webpack-plugin-replace');
const webpack = require('webpack');

module.exports = () => {
  const ENV = process.env.NODE_ENV || 'development';
  const EXT = !!process.env.EXT_ENV || false;
  const PATH = EXT ? path.join(__dirname, '../resources/drizzle') : path.resolve(__dirname, 'dist');
  const PUBLIC_PATH = EXT ? '{{root}}/resources/drizzle' : '/';

  const config = {
    target: 'web',
    entry: {
      app: './src/index.js'
    },
    output: {
      path: PATH,
      filename: '[name].js',
      chunkFilename: '[name].chunk.js',
      publicPath: PUBLIC_PATH
    },
    devServer: {
      contentBase: PATH,
      historyApiFallback: true
    },
    performance: {
      hints: false
    },
    stats: {
      colors: true,
      chunks: false,
      modules: false,
    },
    resolve: {
      alias: {
        components: path.join(__dirname, './src/components'),
        helpers: path.join(__dirname, './src/helpers'),
        polyfills: path.join(__dirname, './src/polyfills'),
        views: path.join(__dirname, './src/views')
      }
    },
    module: {
      rules: [
        {
          test: [/\.js$/, /\.jsx$/],
          loader: 'babel-loader',
          exclude: /node_modules/,
        },
        {
          test: /\.less$/,
          use: ['style-loader', 'css-loader', 'less-loader']
        },
        {
          test: /\.css$/,
          loader: ['style-loader', 'css-loader']
        },
        {
          test: /\.jpe?g$|\.gif$|\.png$|\.ttf$|\.eot$|\.svg$/,
          use: 'file-loader?name=[name].[ext]?[hash]'
        },
        {
          test: /\.woff(2)?(\?v=[0-9]\.[0-9]\.[0-9])?$/,
          loader: 'url-loader?limit=10000&mimetype=application/fontwoff'
        },
        {
          test: [/\.js$/, /\.jsx$/],
          exclude: /node_modules/,
          loader: 'eslint-loader'
        }
      ]
    },
    plugins: [
      new HtmlWebpackPlugin({
        alwaysWriteToDisk: true,
        template: './src/index.html',
        inject: 'body',
        hash: ENV !== 'development',
        chunks: ['app'],
        filename: 'index.html'
      }),
      new MiniCssExtractPlugin({
        filename: '[name].css',
        allChunks: true,
      }),
      new ReplacePlugin({
        exclude: path.join(__dirname, 'src', 'index.js'),
        include: true,
        patterns: [{
          regex: /localStorage/g,
          value: 'ls'
        }],
        values: {
          ls: 'ls'
        }
      }),
      new webpack.optimize.AggressiveMergingPlugin(),
    ]
  };

  switch (ENV) {
    case 'production':
      config.devtool = false;
      config.optimization = { minimize: true };
      break;
    case 'development':
      config.watch = !EXT;
      config.devtool = 'source-map';
      break;
    case 'test':
      config.devtool = 'source-map';
      delete config.entry;
      break;
    default:
      break;
  }

  return config;
};
