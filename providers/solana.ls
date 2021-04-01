require! {
    \moment
    \prelude-ls : { map, pairs-to-obj, foldl, any, each, find, sum, filter, head, values, join, reverse, uniqueBy }
    \./superagent.js : { get, post }
    \../math.js : { plus, minus, div, times }
    \./deps.js : { BitcoinLib, bip39 }
    \../json-parse.js
    \../deadline.js
    \bs58 : { decode }
    \../guid    
    #\multicoin-address-validator : \WAValidator
    #\./deps-standard.js : { solanaWeb3 }
    \bn.js : { BN }  
    \bs58
    \buffer :{Buffer}
#    \crypto-hash : { sha256 }  
    \tweetnacl 
    \bip39 
    \./solana/index.cjs.js : solanaWeb3
    \ed25519-hd-key : { derivePath, getMasterKeyFromSeed, getPublicKey  }
    \buffer-layout : \lo
    \assert     
}
find-max = (first, current)->
    if current.rank < first.rank then current else first
get-enough = ([output, ...outputs], amount, you-have, cb)->
    return cb "Not Enough Funds (Unspent Outputs). You have #{you-have}" if not output?
    return cb "Expected output amount, got #{output.amount}" if not output.amount?
    output-amount = output.amount ? 0
    next-amount = amount `minus` output-amount
    return cb null, [output] if +next-amount <= 0
    you-have-next = you-have `plus` output-amount
    err, other <- get-enough outputs, next-amount, you-have-next
    return cb err if err?
    current =
        | +output-amount is 0 => []
        | _ => [output]
    all = current ++ other
    cb null, all
calc-fee-per-byte = (config, cb)->
    { network, fee-type, account } = config
    o = network?tx-fee-options
    tx-fee = o?[fee-type] ? network.tx-fee ? 0
    return cb null, tx-fee if fee-type isnt \auto
    fee-type = \cheap
    amount-fee = o.cheap
    recipient = config.account.address
    #console.log { config.amount, amount-fee }
    err, data <- create-transaction { fee-type, amount-fee , recipient, ...config }
    return cb null, o.cheap if "#{err}".index-of("Not Enough Funds (Unspent Outputs)") > -1
    return cb err, o.cheap if err?
    return cb "raw-tx is expected" if typeof! data.raw-tx isnt \String
    #bytes = decode(data.raw-tx).to-string(\hex).length / 2
    bytes = data.raw-tx.length / 2
    infelicity = 1
    calc-fee = (bytes + infelicity) `times` o.fee-per-byte
    final-price =
        | calc-fee > +o.cheap => calc-fee
        | _ => o.cheap
    cb null, final-price
export calc-fee = (config, cb)->
    { network, tx, tx-type, account } = config
    err, result <- make-query network, \getRecentBlockhash , []
    return cb err if err?
    return cb "Error: #{result?err}" if result.value.err?    
    return cb "Error: #{result?text}" if not result?value?feeCalculator?
    lamportsPerSignature = result.value.feeCalculator.lamportsPerSignature  
    dec = get-dec(network)
    { txFee } = network     
    fee = 
        | lamportsPerSignature? => lamportsPerSignature `div` dec
        | _ => txFee      
    cb null, fee   
make-query = (network, method, params, cb)->
    { web3-provider } = network.api
    query = {
        jsonrpc : \2.0
        id : guid!   
        method
        params
    }
    err, data <- post web3-provider, query .end
    return cb "query err: #{err.message ? err}" if err?
    return cb data.body.error if data.body.error?
    cb null, data.body.result
toBase58 = (obj)->
    bs58.encode(obj)
toBuffer = (arr) ->
    if arr instanceof Buffer
        arr
    else
        if arr instanceof Uint8Array then Buffer.from arr.buffer, arr.byteOffset, arr.byteLength else Buffer.from arr  
getAccountInfo = (network, address, cb)-> 
    address = data.address    
    err, result <- make-query network, \getAccountInfo , [address, {"encoding": "base58"}]
    return cb err if err?
    return cb "Error: #{err}" if not result?    
    cb null, result.value
export get-keys = ({ network, mnemonic, index }, cb)->
    err, acc <- get-account mnemonic, index
    cb null, acc  
extend = (add, json)--> json <<< add
get-dec = (network)->
    { decimals } = network
    10^decimals
add-amount = (network, it)-->
    dec = get-dec network
    it.amount =
        | it.value? => it.value `div` dec
        | _ => 0
parse-rate-string = (usd-info)->
    [_, url, extract] = usd-info.match(/url\(([^)]+)\)(.+)?/)
    { url, extract }
extract-val = (data, [head, ...tail])->
    return data if not head?
    extract-val data[head], tail
parse-result = (text, extract, cb)->
    return cb null, text if (extract ? "") is ""
    err, model <- json-parse text
    return cb err if err?
    result = extract-val model, extract
    cb null, result
get-deposit-address-info = ({ amount, recipient, network }, cb)->
    { mixing-info } = network?api ? {}
    return cb "Mixing Pool is not connected" if typeof! mixing-info isnt \String
    { url, extract } = parse-rate-string mixing-info
    err, data <- get url .end
    return cb "cannot get deposit info - err: #{err.message ? err}" if err?
    cb null, parse-result(data.text, extract)
get-error = (config, fields)->
    result =
        fields
            |> filter -> not config[it]?
            |> map -> "#{it} is required field"
            |> join ", "
    return null if result is ""
    result
getRecentBlockhash = (network, cb)->
    err, result <- make-query network, \getRecentBlockhash , [ {commitment: "max"} ]
    return cb err if err?
    return cb "Error: #{result?err}" if result.value.err?    
    return cb "Error: #{result?text}" if not result?value?blockhash?
    cb null, result.value.blockhash
export get-account = (mnemonic, index, cb)->
    seed = bip39.mnemonic-to-seed(mnemonic)
    hexSeed = seed.to-string(\hex)     
    { key, chainCode} = derivePath("m/#{index}'/2147483647'", hexSeed)
    pair = tweetnacl.sign.keyPair.fromSeed(new Uint8Array(key))
    private-key = toBase58(pair.secretKey) 
    public-key = toBase58(pair.publicKey)
    cb null, { address: public-key, private-key, public-key, secret-key: pair.secretKey }     
freeOwnership = ->
    ds = lo.struct([lo.u32('tag')])
    b = Buffer.alloc(4)
    ds.encode({ tag: 2 }, b)
    return b
swapNativeToEvmData = (lamports, addr)->  
    ds = lo.struct([lo.u32('tag'),
        lo.nu64('lamports'),
        lo.nu64('array_len'),
    ])
    assert.strictEqual(ds.offsetOf('tag'), 0)
    assert.strictEqual(ds.offsetOf('lamports'), 4)
    assert.strictEqual(ds.offsetOf('array_len'), 12)
    b = Buffer.alloc(20)
    ds.encode({ tag: 1, lamports: lamports, array_len: 42 }, b)
    return Buffer.concat([b, Buffer.from(addr, "utf8")])
swapNativeToEvm = (owner, lamports, addr)->
    EVM_STATE = new solanaWeb3.PublicKey(
        'EvmState11111111111111111111111111111111111',
    )
    EVM_CODE = new solanaWeb3.PublicKey(
        'EVM1111111111111111111111111111111111111111',
    )
    keys = [
        { pubkey: EVM_STATE, isSigner: false, isWritable: true },
        { pubkey: owner, isSigner: false, isWritable: true },
    ]
    transaction = new solanaWeb3.Transaction()
    try    
        transaction.add(solanaWeb3.SystemProgram.assign({accountPubkey: owner, programId:EVM_CODE }))
        transaction.add(new solanaWeb3.TransactionInstruction({
            keys,
            data: swapNativeToEvmData(lamports, addr),
            programId: EVM_CODE
        }))
        transaction.add(new solanaWeb3.TransactionInstruction({
            keys,
            data: freeOwnership(),
            programId: EVM_CODE
        }))
    catch err
        console.error "err:" err    
        return 
    return transaction 
receiver-is-contract = (addr)->
    addr is "0x56454c41532d434841494e000000000053574150"      
export create-transaction = (config, cb)->   
    err = get-error config, <[ network account amount amountFee recipient ]>
    return cb err if err?
    { network, account, recipient, amount, amount-fee, data, fee-type, tx-type, gas-price, gas, swap } = config
    console.log "[create-transaction] config" config
    dec = get-dec network
    pay-account = new solanaWeb3.Account(config.account.secret-key)
    err, recentBlockhash <- getRecentBlockhash(network)
    return cb err if err?
    transaction-data = {} 
    amount = config.amount `times` dec
    transaction = {}
    to-hex = ->
        new BN(it)
    console.log "recipient" recipient
    if swap? and swap is yes then
        console.log "---> swapNativeToEvm"
        transaction = swapNativeToEvm(pay-account.public-key, amount, recipient)
        transaction.recentBlockhash = recentBlockhash     
    else 
        transaction-data = solanaWeb3.SystemProgram.transfer({
            fromPubkey: pay-account.public-key
            toPubkey: recipient
            lamports: amount
        })
        transaction = new solanaWeb3.Transaction({recentBlockhash}).add(transaction-data)  
    try    
        transaction.sign(pay-account)
    catch err 
        console.error "Tx sign error:" err      
    encoded = transaction.serialize!.toString('base64') 
    console.log "encoded" encoded
    cb null, { raw-tx: encoded }
export push-tx = (config, cb)--> 
    console.log "push tx config" config    
    err, result <- make-query config.network, \sendTransaction , [ config.raw-tx, {encoding: 'base64'} ]
    return cb err if err?
    console.log "[push-tx] result" result    
    return cb "[push-tx] Error: #{err}" if err?    
    cb null, result   
export get-total-received = ({ address, network }, cb)->
    return cb "Url is not defined" if not network?api?url?
    err, data <- get "#{get-api-url network}/address/#{address}/totalReceived" .timeout { deadline } .end
    return cb err if err? or data.text.length is 0
    dec = get-dec network
    num = data.text `div` dec
    cb null, num
export get-unconfirmed-balance = ({ network, address} , cb)->
    cb "Not Implemented"
export get-balance = ({ network, address} , cb)->
    err, result <- make-query network, \getBalance , [ address ]
    return cb err if err?
    dec = get-dec network
    number = result.value    
    balance = number `div` dec
    cb null, balance
get-api-url = (network)->
    api-name = network.api.api-name ? \api
    network-name = global.store?.current?.network || \mainnet
    "#{network.api.url}/#{api-name}/BTC/#{network-name}"
export check-tx-status = ({ network, tx }, cb)->
    cb "Not Implemented"
export get-transactions = ({ network, address}, cb)->
    return cb "Url is not defined" if not network?api?url?
    err, result <- make-query network, \getConfirmedSignaturesForAddress2 , [ address, {limit: 25} ]
    return cb err if err?   
    txs = result
    return cb null, [] if txs.length is 0 
    #return cb null, [] 
    err, all-txs <- prepare-raw-txs {txs, network, address} 
    return cb err if err?   
    return cb "Unexpected result" if typeof! all-txs isnt \Array                
    cb null, all-txs
prepare-raw-txs = ({ txs, network, address }, cb)->    
    err, result <- prepare-txs network, txs, address 
    return cb err if err? 
    cb null, result
prepare-txs = (network, [tx, ...rest], address, cb)->
    return cb null, [] if not tx? 
    { blockTime, signature, slot } = tx
    err, data <- make-query network, \getConfirmedTransaction , [ signature, 'jsonParsed' ]
    return cb err if err?
    tx-data = data
    {fee, err, status} = tx-data.meta 
    transaction = tx-data.transaction
    {accountKeys,instructions} = transaction.message
    senders = 
        accountKeys
            |> filter (-> it.signer is yes)  
    sender = senders[0].pubkey
    receiver-index = 0    
    _receivers = 
        accountKeys
            |> filter (it)-> 
                is-receiver = it.signer is no and it.writable is yes   
                receiver-index++ if not is-receiver      
                is-receiver
    receiver-obj = 
        | _receivers.length is 1 => _receivers[0]
        | _receivers >= 1 =>
            t = _receivers |> filter (it.pubkey.index-of("EvmState") < 0)
            if t.length > 0 then t[0] else {}   
        | _ => {} 
    {instructions} = transaction.message 
    receiver = 
        | receiver-obj?pubkey => receiver-obj.pubkey 
        | instructions[0]?parsed?info?destination => instructions[0].parsed.info.destination
        | _ => ""     
    value = 
        | instructions[0]?parsed?info?lamports => instructions[0].parsed.info.lamports
        | _ => get-sent-amount(tx-data)[receiver]
    value = value ? '0' 
    time = moment(+blockTime*1000).format("X")
    dec = get-dec network 
    { url, cluster, customUrl } = network.api
    uri = 
        | cluster? => "#{url}/tx/#{signature}?cluster=#{cluster}"
        | _ => "#{url}/tx/#{signature}" 
    uri = uri + "&customUrl=#{customUrl}" if cluster? and customUrl?
    type = 
        |  address isnt receiver => "OUT"
        |  _ => "IN"  
    recipient-type = \regular 
    _tx = { 
        tx: signature 
        amount: value `div` dec  
        url: uri
        to: receiver  
        pending: not (!tx-data.meta.status.Ok?)
        from: sender    
        time
        fee: tx-data.meta.fee `div` dec 
        type
        recipient-type 
    }
    t = if _tx? then [_tx] else []    
    err, other <- prepare-txs network, rest, address 
    return cb err if err?
    all =  t ++ other    
    cb null, all 
get-sent-amount = (tx)->
    return 0 if not tx?
    index = 0    
    post-balances = tx.meta.postBalances
    pre-balances = tx.meta.preBalances 
    accounts = tx.transaction.message.accountKeys
    accounts 
        |> map (it)->
            preBalance = pre-balances[index] ? 0    
            postBalance = post-balances[index] ? 0
            index++    
            diff = "#{preBalance}" `minus` "#{postBalance}"
            [it.pubkey, Math.abs(+diff)] 
        |> pairs-to-obj       
#export isValidAddress = ({ address, network }, cb)-> 
#    addressIsValid = WAValidator.validate(address, 'BTC', 'both')   
#    return cb "Address is not valid" if not addressIsValid   
#    return cb null, address
export get-transaction-info = (config, cb)->
    { network, tx } = config
    signature = tx  
    err, data <- make-query network, \getConfirmedTransaction , [ signature, 'jsonParsed' ]
    return cb err if err?
    return cb null, { status: \pending } if not err? and not data?   
    tx-data = data
    {fee, err, status} = tx-data.meta 
    transaction = tx-data.transaction
    {accountKeys,instructions} = transaction.message
    senders = 
        accountKeys
            |> filter (-> it.signer is yes)  
    sender = senders[0].pubkey
    {instructions} = transaction.message   
    receiver = instructions[0].parsed.info.destination
    status =
        | (tx-data.meta.status.Ok isnt undefined) => \confirmed
        #| tx.status is \0x1 => \reverted
        | _ => \pending
    result = { from: sender, to: receiver, status, info: tx }
    cb null, result