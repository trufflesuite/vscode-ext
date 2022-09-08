const HelloBlockchain = artifacts.require('HelloBlockchain');

module.exports = function (deployer) {
  deployer.deploy(HelloBlockchain, 'Hello Blockchain');
};
