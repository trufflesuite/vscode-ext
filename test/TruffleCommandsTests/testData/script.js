const TestContract = artifacts.require("./TestContract");

const main = async (cb) => {
  try {
    const accounts = await web3.eth.getAccounts();
  } catch(err) {
    console.log('Doh! ', err.message);
  }
  cb();
}

module.exports = main;
