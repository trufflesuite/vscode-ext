// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

// This is a script for truffle exec command. The purpose is to resolve the provider
// We cann't use truffle-config since it requires specific "npm install" command in user project
// (npm install against the concrete version of electron the VS Code is built on)
module.exports = function(callback) {
    var currentProvider = web3.eth.currentProvider;
    var providerUrl = '';
    var protocol = '';
    var constructor = currentProvider.constructor + '';
    if (constructor.indexOf('HttpProvider') !== -1) {
        protocol = 'http';
        providerUrl = currentProvider.host;
    }
    if (constructor.indexOf('WebsocketProvider') !== -1) {
        protocol = 'ws';
        providerUrl = currentProvider.connection.url;
    }
    var result = 'provider%=' + JSON.stringify({ url: providerUrl, protocol: protocol });
    console.log(result);
    callback();
}