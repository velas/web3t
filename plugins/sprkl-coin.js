// Generated by LiveScript 1.6.0
(function(){
  var mainnet, ropsten, color, testnet, type, enabled, token, image, usdInfo, out$ = typeof exports != 'undefined' && exports || this;
  out$.mainnet = mainnet = {
    decimals: 18,
    txFee: '0.0014',
    messagePrefix: 'Ethereum',
    address: '0x73779dF3F86A4F314655247443dB8780a9b9F4CC',
    mask: '0x0000000000000000000000000000000000000000',
    api: {
      provider: 'erc20',
      web3Provider: 'https://mainnet.infura.io/v3/843d2e25655c47c7851744f65ce95837',
      url: 'https://etherscan.io',
      apiUrl: 'https://api.etherscan.io/api'
    }
  };
  out$.ropsten = ropsten = {
    decimals: 18,
    txFee: '0.0020',
    address: '0x57BC203385A221942449c4bB1dBc0D775c8B5A02',
    messagePrefix: 'Ethereum',
    mask: '0x0000000000000000000000000000000000000000',
    api: {
      provider: 'erc20',
      web3Provider: "https://ropsten.infura.io/v3/009278d1b77a4af48536f1f772926648",
      url: "https://ropsten.etherscan.io",
      apiUrl: "http://api-ropsten.etherscan.io/api"
    }
  };
  out$.color = color = '#5E72E4';
  out$.testnet = testnet = ropsten;
  out$.type = type = 'coin';
  out$.enabled = enabled = true;
  out$.token = token = 'sprkl';
  out$.image = image = './res/sparkle-ethnamed.png';
  out$.usdInfo = usdInfo = 1;
}).call(this);
