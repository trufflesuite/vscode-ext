// Copyright (c) Consensys Software Inc. All rights reserved.
// Licensed under the MIT license.

// This is a script for truffle exec command. The purpose is to resolve the provider
// We can't use truffle-config since it requires specific "npm install" command in user project
// (npm install against the concrete version of electron the VS Code is built on)
module.exports = function (callback) {
  const currentProvider = web3.eth.currentProvider;
  let providerUrl = '';
  let protocol = '';
  const constructor = currentProvider.constructor + '';
  if (constructor.indexOf('HttpProvider') !== -1) {
    protocol = 'http';
    providerUrl = currentProvider.host;
  }
  if (constructor.indexOf('WebsocketProvider') !== -1) {
    protocol = 'ws';
    providerUrl = currentProvider.connection.url;
  }
  const result = 'provider%=' + JSON.stringify({url: providerUrl, protocol: protocol});
  console.log(result);
  callback();
};
