require! {
    \./providers/eth.ls
    \./providers/insight.ls
    \./providers/bitcore.ls
    \./providers/erc20.ls
    \./providers/omni.ls
    \./providers/velas2.ls
    \./providers/solana.ls
    \./providers/velas_evm.ls
    \./providers/bnb.ls
    \./providers/velas_bep20.ls
    \./providers/huobi.ls
    \./providers/velas_huobi.ls
}
extend-providers = (providers, config)->
    return if typeof! config.providers isnt \Object
    providers <<<< config.providers
module.exports = (config, cb)->
   def = { eth, insight, erc20, omni, velas2, velas_evm, bitcore, solana, bnb, velas_bep20, huobi, velas_huobi }
   extend-providers def, config
   cb null, def
