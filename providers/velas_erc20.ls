require! {
    \qs : { stringify }
    \prelude-ls : { filter, map, foldl, each, sort-by, reverse }
    \../math.js : { plus, minus, times, div, from-hex }
    \./superagent.js : { get, post }
    \./deps.js : { Web3, Tx, BN, hdkey, bip39, ERC20BridgeToken }
    \../json-parse.js
    \../deadline.js
    \bs58 : { decode, encode }
    \ethereumjs-common : { default: Common }
    \../addresses.js : { vlxToEth, ethToVlx }
    \crypto-js/sha3 : \sha3   
    \../contracts/ERC20BridgeToken.json    
}
isChecksumAddress = (address) ->
    address = address.replace '0x', ''
    addressHash = sha3 address.toLowerCase!
    i = 0
    while i < 40
        return false if (parseInt addressHash[i], 16) > 7 and address[i].toUpperCase! isnt address[i] or (parseInt addressHash[i], 16) <= 7 and address[i].toLowerCase! isnt address[i]
        i++
    true
isAddress = (address) ->
    if not //^(0x)?[0-9a-f]{40}$//i.test address
        false
    else
        if (//^(0x)?[0-9a-f]{40}$//.test address) or //^(0x)?[0-9A-F]{40}$//.test address then true else isChecksumAddress address
to-velas-address = (eth-address-buffer)->
    s1 = encode eth-address-buffer
    "V#{s1}"
to-eth-address = (velas-address, cb)->
    return cb "required velas-address as a string" if typeof! velas-address isnt \String
    return cb null, velas-address if isAddress velas-address
    return cb "velas address can be started with V" if velas-address.0 isnt \V
    #NEW_ADDRESS
    res = null
    try
        res = vlxToEth(velas-address)
    catch err
        return cb err
    return cb null, res
    # return cb null, vlxToEth(velas-address)
    # bs58str = velas-address.substr(1, velas-address.length)
    # try
    #     bytes = decode bs58str
    #     hex = bytes.toString('hex')
    #     eth-address = \0x + hex
    #     #return cb "incorrect velas address" if not isAddress eth-address
    #     cb null, eth-address
    # catch err
    #     cb err
window?to-eth-address = vlxToEth if window?
window?to-velas-address = ethToVlx if window?
export isValidAddress =  ({ address }, cb)->
    err <- to-eth-address address
    return cb "Given address is not valid Velas address" if err?
    cb null, yes
get-ethereum-fullpair-by-index = (mnemonic, index, network)->
    seed = bip39.mnemonic-to-seed(mnemonic)
    wallet = hdkey.from-master-seed(seed)
    w = wallet.derive-path("m0").derive-child(index).get-wallet!
    address = \0x + w.get-address!.to-string(\hex)
    vlx-address = ethToVlx w.get-address!.to-string(\hex)    
    private-key = w.get-private-key-string!
    public-key = w.get-public-key-string!
    { address, vlx-address, private-key, public-key }
try-parse = (data, cb)->
    <- set-immediate
    return cb null, data if typeof! data.body is \Object
    console.log data if typeof! data?text isnt \String
    return cb "expected text" if typeof! data?text isnt \String
    try
        сonsole.log \try-parse, data.text, JSON.parse
        data.body = JSON.parse data.text
        cb null, data
    catch err
        #console.log \parse-err, err, data.text
        cb err
make-query = (network, method, params, cb)->  
    { web3-provider } = network.api
    query = {
        jsonrpc : \2.0
        id : 1
        method
        params
        secret: \494f6287e5974752bbc4281598c3993f    
    }
    err, data <- post web3-provider, query .end
    return cb "query err: #{err.message ? err}" if err?
    err, data <- try-parse data
    return cb err if err?
    return cb "expected object" if typeof! data.body isnt \Object
    return cb data.body.error if data.body?error?
    console.log "[make-query] " network.api.web3-provider, method, params 
    console.log "[make-query] result:" data.body.result
    cb null, data.body.result
export get-transaction-info = (config, cb)->
    { network, tx } = config
    query = [tx]
    err, tx <- make-query network, \eth_getTransactionReceipt , query
    return cb err if err?
    status =
        | typeof! tx isnt \Object => \pending
        | tx.status is \0x0 => \reverted
        | tx.status is \0x1 => \confirmed
        | _ => \pending
    result = { tx?from, tx?to, status, info: tx }
    cb null, result
get-gas-estimate = ({ network, query, gas }, cb)->
    return cb null, gas if gas?
    err, estimate <- make-query network, \eth_estimateGas , [ query ]
    return cb null, 1000000 if err?
    #err, estimate <- web3.eth.estimate-gas { from, nonce, to, data }
    estimate-normal = from-hex(estimate)
    return cb null, 1000000 if +estimate-normal < 1000000
    cb null, estimate-normal
export calc-fee = ({ network, fee-type, account, amount, to, data, gas-price, gas }, cb)->
    return cb null if typeof! to isnt \String or to.length is 0
    return cb null if fee-type isnt \auto
    dec = get-dec network
    err, gas-price <- calc-gas-price { fee-type, network, gas-price }
    return cb err if err?
    data-parsed =
        | data? => data
        | _ => '0x'
    err, from <- to-eth-address account.address
    console.error "calc-fee from address #{err}" if err?
    return cb "Given address is not valid Velas address" if err?
    err, to <- to-eth-address to
    console.error "calc-fee from address #{err}" if err?
    return cb "Given address is not valid Velas address" if err?
    query = { from, to, data: data-parsed }
    err, estimate <- get-gas-estimate { network, query, gas }
    return cb err if err?
    #return cb "estimate gas err: #{err.message ? err}" if err?
    res = gas-price `times` estimate
    val = res `div` dec
    cb null, val
export get-keys = ({ network, mnemonic, index }, cb)->
    result = get-ethereum-fullpair-by-index mnemonic, index, network
    cb null, result
round = (num)->
    Math.round +num
to-hex = ->
    new BN(it)
transform-tx = (network, description, t)-->
    { url } = network.api
    dec = get-dec network
    network = \eth
    tx =
        | t.hash? => t.hash
        | t.transactionHash? => t.transactionHash
        | _ => "unknown"
    status =
        | +t.confirmations > 0 => \confirmed       
        | t.status is \0x0 => \reverted
        | _ => \pending
    amount = t.value `div` dec
    time = t.time-stamp
    url = "#{url}/tx/#{tx}"
    gas-used = t.gas-used ? 0
    gas-price = t.gas-price ? 0
    fee = gas-used `times` gas-price `div` dec
    recipient-type = if (t.input ? "").length > 3 then \contract else \regular
    { network, tx, status, amount, fee, time, url, t.from, t.to, recipient-type, description }
get-internal-transactions = ({ network, address }, cb)->
    err, address <- to-eth-address address
    return cb err if err?
    { api-url } = network.api
    module = \account
    action = \txlistinternal
    startblock = 0
    endblock = 99999999
    sort = \desc
    apikey = \4TNDAGS373T78YJDYBFH32ADXPVRMXZEIG
    page = 1
    offset = 20
    console.log("api-url", api-url, action)
    query = stringify { module, action, apikey, address, sort, startblock, endblock, page, offset }
    err, resp <- get "#{api-url}?#{query}" .timeout { deadline } .end
    return cb "cannot execute query - err #{err.message ? err }" if err?
    err, result <- json-parse resp.text
    return cb "cannot parse json: #{err.message ? err}" if err?
    return cb "Unexpected result" if typeof! result?result isnt \Array
    txs =
        result.result |> map transform-tx network, 'internal'
    cb null, txs
get-external-transactions = ({ network, address }, cb)->
    err, address <- to-eth-address address
    return cb err if err?
    { api-url } = network.api
    module = \account
    action = \txlist
    startblock = 0
    endblock = 99999999
    page = 1
    offset = 20
    sort = \desc
    apikey = \4TNDAGS373T78YJDYBFH32ADXPVRMXZEIG
    query = stringify { module, action, apikey, address, sort, startblock, endblock, page, offset }
    console.log("api-url", api-url, action)
    err, resp <- get "#{api-url}?#{query}" .timeout { deadline } .end
    return cb "cannot execute query - err #{err.message ? err }" if err?
    err, result <- json-parse resp.text
    return cb "cannot parse json: #{err.message ? err}" if err?
    return cb "Unexpected result" if typeof! result?result isnt \Array
    txs =
        result.result |> map transform-tx network, 'external'
    #console.log api-url, result.result, txs
    cb null, txs
export get-transactions = ({ network, address }, cb)->
    console.log "get-transactions erc20 vlx"    
    { api-url } = network.api
    module = \account
    action = \tokentx
    startblock = 0
    endblock = 99999999
    sort = \asc
    apikey = \4TNDAGS373T78YJDYBFH32ADXPVRMXZEIG
    query = stringify { module, action, apikey, address, sort, startblock, endblock }
    console.log "get-url " "#{api-url}?#{query}"   
    err, resp <- get "#{api-url}?#{query}" .timeout { deadline } .end
    return cb err if err?
    err, result <- json-parse resp.text
    return cb err if err?
    return cb "Unexpected result" if typeof! result?result isnt \Array
    txs =
        result.result
            #|> filter -> it.contract-address is network.address
            |> map transform-tx network, 'external' 
    cb null, txs
export get-contract-transactions = ({ network, address }, cb)->
    console.log "[get-contract-transactions]"    
    err, address <- to-eth-address address
    return cb err if err?
    { api-url } = network.api
    module = \contract
    action = \getabi
    startblock = 0
    endblock = 99999999
    page = 1
    offset = 20
    sort = \desc
    apikey = \4TNDAGS373T78YJDYBFH32ADXPVRMXZEIG
    query = stringify { module, action, apikey, address, sort, startblock, endblock, page, offset }
    console.log "#{api-url}?#{query}"
    err, resp <- get "#{api-url}?#{query}" .timeout { deadline } .end
    return cb "cannot execute query - err #{err.message ? err }" if err?
    err, result <- json-parse resp.text
    return cb "cannot parse json: #{err.message ? err}" if err?
    return cb "Unexpected result" if typeof! result?result isnt \Array
    txs =
        result.result |> map transform-tx network, 'external'
    cb null, txs
get-dec = (network)->
    { decimals } = network
    10^decimals
calc-gas-price = ({ fee-type, network, gas-price }, cb)->
    return cb null, gas-price if gas-price?
    return cb null, 22000 if fee-type is \cheap
    err, price <- make-query network, \eth_gasPrice , []
    return cb "calc gas price - err: #{err.message ? err}" if err?
    price = from-hex(price)
    return cb null, 22000 if +price < 22000
    cb null, price
try-get-latest = ({ network, account }, cb)->
    err, address <- to-eth-address account.address
    return cb err if err?
    err, nonce <- make-query network, \eth_getTransactionCount , [ address, "latest" ]
    return cb "cannot get nonce (latest) - err: #{err.message ? err}" if err?
    next = +from-hex(nonce)
    cb null, next
get-nonce = ({ network, account }, cb)->
    #err, nonce <- web3.eth.get-transaction-count
    err, address <- to-eth-address account.address
    return cb err if err?
    err, nonce <- make-query network, \eth_getTransactionCount , [ address, \pending ]
    return try-get-latest { network, account }, cb if err? and "#{err.message ? err}".index-of('not implemented') > -1
    return cb "cannot get nonce (pending) - err: #{err.message ? err}" if err?
    cb null, from-hex(nonce)
is-address = (address) ->
    if not //^(0x)?[0-9a-f]{40}$//i.test address
        false
    else
        true
get-contract-instance = (web3, addr)->
    abi = ERC20BridgeToken.abi
    tokenAddress = \0x3e0Aa75a75AdAfcf3cb800C812b66B4aaFe03B52    
    web3.eth.contract(abi).at(tokenAddress)
export create-transaction = (config, cb)-->
    { network, account, recipient, amount, amount-fee, data, fee-type, tx-type, gas-price, gas, swap, chainId } = config 
    return cb "address in not correct ethereum address" if not is-address recipient
    web3 = get-web3 network
    dec = get-dec network
    private-key = new Buffer account.private-key.replace(/^0x/,''), \hex
    err, nonce <- web3.eth.get-transaction-count account.address, \pending
    return cb err if err?
    return cb "nonce is required" if not nonce?
    contract = get-contract-instance web3, network.address
    to-wei = -> it `times` dec
    to-wei-eth = -> it `times` (10^18)
    to-eth = -> it `div` (10^18)
    value = to-wei amount
    err, gas-price <- calc-gas-price { fee-type, network, gas-price }
    return cb err if err?
    gas-minimal = to-wei-eth(amount-fee) `div` gas-price
    gas-estimate = round ( gas-minimal `times` 5 )
    err, balance <- get-balance { network, account.address }
    return cb err if err?
    balance-eth = to-eth balance
    to-send = amount `plus` amount-fee
    return cb "Balance #{balance} is not enough to send tx #{to-send}" if +balance < +to-send
    console.log "Data" config.data   
    if not (config.data? and swap?) then 
        console.log "NO DATA WAS SPECIFIED or it is swap!"   
        data =
            | contract.methods? => contract.methods.transfer(recipient, value).encodeABI!
            | _ => contract.transfer.get-data recipient, value 
    tx = new Tx do
        nonce: to-hex nonce
        gas-price: to-hex gas-price
        value: to-hex "0"
        gas: to-hex gas-estimate
        to: recipient
        from: account.address
        data: config.data || \0x
        chainId: chainId 
    tx.sign private-key
    rawtx = \0x + tx.serialize!.to-string \hex
    cb null, { rawtx }
export check-decoded-data = (decoded-data, data)->
    return no if not (decoded-data ? "").length is 0
    return no if not (data ? "").length is 0
export push-tx = ({ network, rawtx } , cb)-->
    err, txid <- make-query network, \eth_sendRawTransaction , [ rawtx ]
    #err, txid <- web3.eth.send-signed-transaction rawtx
    return cb "cannot get signed tx - err: #{err.message ? err}" if err?
    cb null, txid
export check-tx-status = ({ network, tx }, cb)->
    cb "Not Implemented"
export get-total-received = ({ address, network }, cb)->
    err, txs <- get-transactions { address, network }
    return cb err if err?
    err, address <- to-eth-address account.address
    return cb err if err?
    total =
        txs |> filter (-> it.to.to-upper-case! is address.to-upper-case!)
            |> map (.amount)
            |> foldl plus, 0
    cb null, total
export get-unconfirmed-balance = ({ network, address} , cb)->
    err, address <- to-eth-address address
    return cb err if err?
    err, number <- make-query network, \eth_getBalance , [ address, \pending ]
    return cb err if err?
    #err, number <- web3.eth.get-balance address
    #return cb "cannot get balance - err: #{err.message ? err}" if err?
    dec = get-dec network
    balance = number `div` dec
    cb null, balance
get-web3 = (network)->
    { web3-provider } = network.api
    new Web3(new Web3.providers.HttpProvider(web3-provider))
export get-balance = ({ network, address} , cb)->
    err, address <- to-eth-address address
    return cb err if err?
    console.log "get-balance" address  
    abi = ERC20BridgeToken.abi
    web3 = get-web3 network
    ERC20BridgeToken_ = web3.eth.contract(abi).at("0x82237607a996A545Bf1e0b447050aa73855300b0")    
    number = ERC20BridgeToken_.balance-of(address)
    dec = get-dec network
    balance = number `div` dec
    console.log "token balance" balance    
    cb null, balance
#console.log \test
#to-eth-address "VADyNxJR9PjWrQzJVmoaKxqaS8Mk", console.log
#console.log to-velas-address Buffer.from("0b6a35fafb76e0786db539633652a8553ac28d67", 'hex')
#
#
#
# SERVICE
#
#
#
#
export get-sync-status = ({ network }, cb)->
    err, estimate <- make-query network, \eth_getSyncing , [ ]
    return cb err if err?
    return cb null, estimate
export get-peer-count = ({ network }, cb)->
    err, estimate <- make-query network, \net_getPeerCount , [ ]
    return cb err if err?
    return cb null, estimate