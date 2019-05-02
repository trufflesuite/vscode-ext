const options = {
  web3: {
    block: false,
    fallback: {
      type: 'ws',
      url: 'ws://127.0.0.1:7545',
    },
  },
  contracts: [],
  events: {},
  polls: {
    accounts: 1500,
  }
};

export default options;
