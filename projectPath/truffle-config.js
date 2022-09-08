module.exports = {
  networks: {
    development: {
      host: '127.0.0.1',
      port: 8545,
      network_id: '*',
    },
    dashboard: {},
  },
  compilers: {
    solc: {
      version: '0.8.13',
    },
  },
  db: {
    enabled: false,
    host: '127.0.0.1',
  },
};
