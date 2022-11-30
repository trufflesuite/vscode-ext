const {merge} = require('webpack-merge');
const common = require('./webpack.common.js');

module.exports = merge(common, {
  mode: 'production',
  // By removing source map generation, we reduce bundle size by 50%.
  // See https://webpack.js.org/configuration/devtool/ for more details.
  devtool: false,
  optimization: {
    minimize: true,
  },
});
