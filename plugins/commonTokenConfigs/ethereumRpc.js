const ethereumRpc = Object.freeze({
  mainnet: {
    api: {
      web3Provider: 'https://mainnet.infura.io/v3/622100399ace495d92c1339f6be12b2b',
      extraWeb3Providers: [
        'https://eth.llamarpc.com',
        'https://eth-mainnet.public.blastapi.io',
        'https://ethereum.publicnode.com',
        'https://rpc.notadegen.com/eth',
        'https://1rpc.io/eth',
        'https://rpc.mevblocker.io',
        'https://endpoints.omniatech.io/v1/eth/mainnet/public',
      ],
    },
  },
});

module.exports = ethereumRpc;