// Copyright (c) 2022. Consensys Software Inc. All rights reserved.
// Licensed under the MIT license.

const {merge} = require('webpack-merge');
const common = require('./webpack.common.js');

module.exports = merge(common, {
  mode: 'production',
  devtool: 'eval',
  optimization: {
    minimize: true,
  },
});
