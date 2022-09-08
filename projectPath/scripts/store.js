const HelloBlockchain = artifacts.require('HelloBlockchain');

module.exports = async (callback) => {
  try {
    const helloBlockchain = await HelloBlockchain.deployed();
    const reciept = await helloBlockchain.SendRequest('Hello World');
    console.log(reciept);
  } catch (err) {
    console.log('Oops: ', err.message);
  }
  callback();
};
