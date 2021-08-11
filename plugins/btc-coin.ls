export mainnet =
    decimals: 8
    tx-fee: \0.00004
    tx-fee-auto-mode: \per-byte
    tx-fee-options:
        auto: \0.00001
        cheap: \0.00004
        fee-per-byte: \0.000005
    mask: '1000000000000000000000000000000000'
    api:
        provider: \bitcore
        url: \https://bitcore.velas.com
        network-name: 'mainnet'
        linktx: \https://bitcore.velas.com/#/BTC/mainnet/tx/:hash
        decimal: 8
        alternative:
            balance: \https://blockchain.info/q/addressbalance/:address
    message-prefix: '\x18Bitcoin Signed Message:\n'
    bech32: 'bc'
    bip32:
        public: 0x0488b21e
        private: 0x0488ade4
    pubKeyHash: 0x00
    scriptHash: 0x05
    wif: 0x80
    group: 'Bitcoin'
export testnet =
    tx-fee: 0.0001
    tx-fee-auto-mode: \per-byte
    decimals: 8
    mask: '1000000000000000000000000000000000'
    api:
        #api-name: \testnet/api
        provider: \bitcore
        url: \https://bitcore.testnet.velas.com   
        network-name: 'testnet'
        linktx: \https://bitpay.com/insight/#/BTC/testnet/tx/:hash
        decimal: 8
    tx-fee-options:
        auto: \0.00001
        cheap: \0.00004
        fee-per-byte: \0.000005
    messagePrefix: '\x18Bitcoin Signed Message:\n'
    topup: \https://testnet.manu.backend.hamburg/faucet
    bech32: 'tb'
    bip32:
        public: 0x043587cf
        private: 0x04358394
    pubKeyHash: 0x6f
    scriptHash: 0xc4
    wif: 0xef
    group: 'Bitcoin'
export color = \#4650E7
export type = \coin
export enabled = yes
export name = \Bitcoin
export nickname = \btc
export wallet-index = 1
export token = \btc
export image = "data:image/png;base64,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"
export usd-info = "url(https://explorer.velas.com/ticker).btc_price"