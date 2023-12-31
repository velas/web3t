const hecoRpc = Object.freeze({
  mainnet: {
    api: {
      web3Provider: 'https://http-mainnet.hecochain.com',
      extraWeb3Providers: [
        'https://http-mainnet-node.huobichain.com',
        'https://rpc.coinsdo.net/heco',
      ],
    },
  },
  testnet: {
    api: {
      web3Provider: 'https://http-testnet.hecochain.com',
      extraWeb3Providers: [
        'https://hecotestapi.terminet.io/rpc'
      ],
    },
  },
});

module.exports = hecoRpc;