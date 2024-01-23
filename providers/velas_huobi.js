
// Generated by LiveScript 1.6.0
(function(){
  var stringify, ref$, filter, map, foldl, each, sortBy, reverse, uniqueBy, plus, minus, times, div, fromHex, $toHex, get, post, Web3, Tx, BN, hdkey, bip39, ERC20BridgeToken, jsonParse, deadline, decode, encode, Common, vlxToEth, ethToVlx, sha3, isChecksumAddress, isAddress, toVelasAddress, toEthAddress, isValidAddress, getEthereumFullpairByIndex, tryParse, makeQuery, getTransactionInfo, getGasEstimate, calcFee, getKeys, round, toHex, transformTx, getInternalTransactions, getExternalTransactions, up, getTransactions, getContractTransactions, getDec, calcGasPrice, tryGetLatest, getNonce, getContractInstance, createTransaction, checkDecodedData, pushTx, checkTxStatus, getTotalReceived, getUnconfirmedBalance, getWeb3, getBalance, getEthBalance, getSyncStatus, getPeerCount, toString$ = {}.toString, out$ = typeof exports != 'undefined' && exports || this;
  stringify = require('qs').stringify;
  ref$ = require('prelude-ls'), filter = ref$.filter, map = ref$.map, foldl = ref$.foldl, each = ref$.each, sortBy = ref$.sortBy, reverse = ref$.reverse, uniqueBy = ref$.uniqueBy;
  ref$ = require('../math.js'), plus = ref$.plus, minus = ref$.minus, times = ref$.times, div = ref$.div, fromHex = ref$.fromHex, $toHex = ref$.$toHex;
  ref$ = require('./superagent.js'), get = ref$.get, post = ref$.post;
  ref$ = require('./deps.js'), Web3 = ref$.Web3, Tx = ref$.Tx, BN = ref$.BN, hdkey = ref$.hdkey, bip39 = ref$.bip39, ERC20BridgeToken = ref$.ERC20BridgeToken;
  jsonParse = require('../json-parse.js');
  deadline = require('../deadline.js');
  ref$ = require('bs58'), decode = ref$.decode, encode = ref$.encode;
  Common = require('ethereumjs-common')['default'];
  ref$ = require('../addresses.js'), vlxToEth = ref$.vlxToEth, ethToVlx = ref$.ethToVlx;
  sha3 = require('crypto-js/sha3');
  ERC20BridgeToken = require('../contracts/ERC20BridgeToken.json');
  commonProvider = require("./common/provider");
  isChecksumAddress = function(address){
    var addressHash, i;
    address = address.replace('0x', '');
    addressHash = sha3(address.toLowerCase());
    i = 0;
    while (i < 40) {
      if (parseInt(addressHash[i], 16) > 7 && address[i].toUpperCase() !== address[i] || parseInt(addressHash[i], 16) <= 7 && address[i].toLowerCase() !== address[i]) {
        return false;
      }
      i++;
    }
    return true;
  };
  isAddress = function(address){
    if (!/^(0x)?[0-9a-f]{40}$/i.test(address)) {
      return false;
    } else {
      if (/^(0x)?[0-9a-f]{40}$/.test(address) || /^(0x)?[0-9A-F]{40}$/.test(address)) {
        return true;
      } else {
        return isChecksumAddress(address);
      }
    }
  };
  toVelasAddress = function(ethAddressBuffer){
    var s1;
    s1 = encode(ethAddressBuffer);
    return "V" + s1;
  };
  toEthAddress = function(velasAddress, cb){
    var res, err;
    if (toString$.call(velasAddress).slice(8, -1) !== 'String') {
      return cb("required velas-address as a string");
    }
    if (isAddress(velasAddress)) {
      return cb(null, velasAddress);
    }
    if (velasAddress[0] !== 'V') {
      return cb("velas address can be started with V");
    }
    res = null;
    try {
      res = vlxToEth(velasAddress);
    } catch (e$) {
      err = e$;
      return cb(err);
    }
    return cb(null, res);
  };
  if (typeof window != 'undefined' && window !== null) {
    if (typeof window != 'undefined' && window !== null) {
      window.toEthAddress = vlxToEth;
    }
  }
  if (typeof window != 'undefined' && window !== null) {
    if (typeof window != 'undefined' && window !== null) {
      window.toVelasAddress = ethToVlx;
    }
  }
  out$.isValidAddress = isValidAddress = function(arg$, cb){
    var address;
    address = arg$.address;
    return toEthAddress(address, function(err){
      if (err != null) {
        return cb("Given address is not valid Velas address");
      }
      return cb(null, true);
    });
  };
  getEthereumFullpairByIndex = function(mnemonic, index, network){
    var seed, wallet, w, address, vlxAddress, privateKey, publicKey;
    seed = bip39.mnemonicToSeed(mnemonic);
    wallet = hdkey.fromMasterSeed(seed);
    w = wallet.derivePath("m/44'/60'/" + index + "'/0/0").getWallet();
    address = '0x' + w.getAddress().toString('hex');
    vlxAddress = ethToVlx(w.getAddress().toString('hex'));
    privateKey = w.getPrivateKeyString();
    publicKey = w.getPublicKeyString();
    return {
      address: address,
      vlxAddress: vlxAddress,
      privateKey: privateKey,
      publicKey: publicKey
    };
  };
  makeQuery = commonProvider.makeQuery;
  out$.getTransactionInfo = getTransactionInfo = function(config, cb){
  var network, tx, query;
    network = config.network, tx = config.tx;
    query = [tx];
    return makeQuery(network, 'eth_getTransactionReceipt', query, function(err, txData){
      var status, result;
      if (err != null) {
        return cb(err);
      }
      status = (function(){
        switch (false) {
        case toString$.call(txData).slice(8, -1) === 'Object':
          return 'pending';
        case txData.status !== '0x0':
          return 'reverted';
        case txData.status !== '0x1':
          return 'confirmed';
        default:
          return 'pending';
        }
      }());
      result = {
        from: txData != null ? txData.from : void 8,
        to: txData != null ? txData.to : void 8,
        status: status,
        info: tx
      };
      return cb(null, result);
    });
  };
  getGasEstimate = function(config, cb){
    var network, feeType, account, amount, to, data, gas, from, web3, contract, receiver, val, value, $data, query;
    network = config.network, feeType = config.feeType, account = config.account, amount = config.amount, to = config.to, data = config.data, gas = config.gas;
    if (gas != null) {
      return cb(null, gas);
    }
    if (+amount === 0) {
      return cb(null, "0");
    }
    from = account.address;
    web3 = getWeb3(network);
    contract = getContractInstance(web3, network.address);
    receiver = (function(){
      switch (false) {
      case !(data != null && data !== "0x"):
        return to;
      default:
        return network.address;
      }
    }());
    val = times(amount, Math.pow(10, network.decimals));
    value = $toHex(val);
    $data = (function(){
      switch (false) {
      case !(data != null && data !== "0x"):
        return data;
      case contract.methods == null:
        return contract.methods.transfer(to, value).encodeABI();
      default:
        return contract.transfer.getData(to, value);
      }
    }());
    query = {
      from: from,
      to: receiver,
      data: $data,
      value: "0x0"
    };
    return makeQuery(network, 'eth_estimateGas', [query], function(err, estimate){
      if (err != null) {
        console.error("[getGasEstimate] error:", err);
      }
      if (err != null) {
        return cb(null, "0");
      }
      return cb(null, fromHex(estimate));
    });
  };
  out$.calcFee = calcFee = function(arg$, cb){
    var network, feeType, account, amount, to, data, gasPrice, gas;
    network = arg$.network, feeType = arg$.feeType, account = arg$.account, amount = arg$.amount, to = arg$.to, data = arg$.data, gasPrice = arg$.gasPrice, gas = arg$.gas;
    if (feeType !== 'auto') {
      return cb(null);
    }
    return calcGasPrice({
      feeType: feeType,
      network: network,
      gasPrice: gasPrice
    }, function(err, gasPrice){
      if (err != null) {
        return cb(err);
      }
      return getGasEstimate({
        network: network,
        feeType: feeType,
        account: account,
        amount: amount,
        to: to,
        data: data,
        gas: gas
      }, function(err, estimate){
        var res, val;
        if (err != null) {
          return cb(null, {
            calcedFee: network.txFee,
            gasPrice: gasPrice
          });
        }
        res = times(gasPrice, estimate);
        val = div(res, Math.pow(10, 18));
        return cb(null, {
          calcedFee: val,
          gasPrice: gasPrice,
          gasEstimate: estimate
        });
      });
    });
  };
  out$.getKeys = getKeys = function(arg$, cb){
    var network, mnemonic, index, result;
    network = arg$.network, mnemonic = arg$.mnemonic, index = arg$.index;
    result = getEthereumFullpairByIndex(mnemonic, index, network);
    return cb(null, result);
  };
  round = function(num){
    return Math.round(+num);
  };
  toHex = function(it){
    return new BN(it);
  };
  transformTx = curry$(function(network, description, t){
    var url, FOREIGN_BRIDGE_TOKEN, dec, tx, status, amount, time, gasUsed, ref$, gasPrice, fee, recipientType, txType, from;
    url = network.api.url;
    FOREIGN_BRIDGE_TOKEN = network.FOREIGN_BRIDGE_TOKEN;
    const FOREIGN_BRIDGE = network.FOREIGN_BRIDGE;
    dec = getDec(network);
    network = 'eth';
    tx = (function(){
      switch (false) {
      case t.hash == null:
        return t.hash;
      case t.transactionHash == null:
        return t.transactionHash;
      default:
        return "unknown";
      }
    }());
    status = (function(){
      switch (false) {
      case !(+t.confirmations > 0):
        return 'confirmed';
      case t.status !== '0x0':
        return 'reverted';
      default:
        return 'pending';
      }
    }());
    amount = div(t.value, dec);
    time = t.timeStamp;
    url = url + "/tx/" + tx;
    gasUsed = (ref$ = t.gasUsed) != null ? ref$ : 0;
    gasPrice = (ref$ = t.gasPrice) != null ? ref$ : 0;
    fee = div(times(gasUsed, gasPrice), Math.pow(10, 18));
    recipientType = ((ref$ = t.input) != null ? ref$ : "").length > 3 ? 'contract' : 'regular';
    txType = (function(){
      switch (true) {
      case t.from === '0x0000000000000000000000000000000000000000':
        return "EVM → HECO Swap";
      case up(t.to) === up(FOREIGN_BRIDGE):
        return "HECO → EVM Swap";
      default:
        return null;
      }
    }());
    from = t.from;
    return {
      network: network,
      tx: tx,
      status: status,
      amount: amount,
      fee: fee,
      time: time,
      url: url,
      from: from,
      to: t.to,
      recipientType: recipientType,
      description: description,
      txType: txType
    };
  });
  getInternalTransactions = function(arg$, cb){
    var network, address;
    network = arg$.network, address = arg$.address;
    return toEthAddress(address, function(err, address){
      var apiUrl, module, action, startblock, endblock, sort, apikey, page, offset, query;
      if (err != null) {
        return cb(err);
      }
      apiUrl = network.api.apiUrl;
      module = 'account';
      action = 'txlistinternal';
      startblock = 0;
      endblock = 99999999;
      sort = 'desc';
      apikey = '4TNDAGS373T78YJDYBFH32ADXPVRMXZEIG';
      page = 1;
      offset = 20;
      query = stringify({
        module: module,
        action: action,
        apikey: apikey,
        address: address
      });
      return get(apiUrl + "?" + query).timeout({
        deadline: deadline
      }).end(function(err, resp){
        var ref$;
        if (err != null) {
          return cb("cannot execute query - err " + ((ref$ = err.message) != null ? ref$ : err));
        }
        return jsonParse(resp.text, function(err, result){
          var ref$, txs;
          if (err != null) {
            return cb("cannot parse json: " + ((ref$ = err.message) != null ? ref$ : err));
          }
          if (toString$.call(result != null ? result.result : void 8).slice(8, -1) !== 'Array') {
            return cb("Unexpected result");
          }
          txs = map(transformTx(network, 'internal'))(
          result.result);
          return cb(null, txs);
        });
      });
    });
  };
  getExternalTransactions = function(arg$, cb){
    var network, address;
    network = arg$.network, address = arg$.address;
    return toEthAddress(address, function(err, address){
      var apiUrl, module, action, startblock, endblock, page, offset, sort, apikey, query;
      if (err != null) {
        return cb(err);
      }
      apiUrl = network.api.apiUrl;
      module = 'account';
      action = 'txlist';
      startblock = 0;
      endblock = 99999999;
      page = 1;
      offset = 20;
      sort = 'desc';
      apikey = '4TNDAGS373T78YJDYBFH32ADXPVRMXZEIG';
      query = stringify({
        module: module,
        action: action,
        apikey: apikey,
        address: address
      });
      return get(apiUrl + "?" + query).timeout({
        deadline: deadline
      }).end(function(err, resp){
        var ref$;
        if (err != null) {
          return cb("cannot execute query - err " + ((ref$ = err.message) != null ? ref$ : err));
        }
        return jsonParse(resp.text, function(err, result){
          var ref$, txs;
          if (err != null) {
            return cb("cannot parse json: " + ((ref$ = err.message) != null ? ref$ : err));
          }
          if (toString$.call(result != null ? result.result : void 8).slice(8, -1) !== 'Array') {
            return cb("Unexpected result");
          }
          txs = map(transformTx(network, 'external'))(
          result.result);
          return cb(null, txs);
        });
      });
    });
  };
  up = function(s){
    return (s != null ? s : "").toUpperCase();
  };
  out$.getTransactions = getTransactions = function(arg$, cb){
    var network, address, token, apiUrl, module, action, startblock, endblock, sort, apikey, query;
    network = arg$.network, address = arg$.address, token = arg$.token;
    apiUrl = network.api.apiUrl;
    module = 'account';
    action = 'tokentx';
    startblock = 0;
    endblock = 99999999;
    sort = 'asc';
    apikey = 'DRXKZ5YNQIAU18EF3EV83UMWW983M56KYR';
    query = stringify({
      module: module,
      action: action,
      apikey: apikey,
      address: address,
      sort: sort,
      page: arg$.page,
      offset: offset,
      // startblock: startblock,
      // endblock: endblock
    });
    return get(apiUrl + "?" + query).timeout({
      deadline: deadline
    }).end(function(err, resp){
      if (err != null) {
        return cb(err);
      }
      return jsonParse(resp.text, function(err, result){
        var $token, txs;
        if (err != null) {
          return cb(err);
        }
        if (toString$.call(result != null ? result.result : void 8).slice(8, -1) !== 'Array') {
          return cb("Unexpected result");
        }
        $token = (function(){
          switch (false) {
          case token !== 'vlx_huobi':
            return 'VLX';
          default:
            return token;
          }
        }());
        $token = up($token);
        txs = map(transformTx(network, 'external'))(
        uniqueBy(function(it){
          return it.hash;
        })(
        filter(function(it){
          return up(it.contractAddress) === up(network.address);
        })(
        result.result)));
        return cb(null, txs);
      });
    });
  };
  out$.getContractTransactions = getContractTransactions = function(arg$, cb){
    var network, address;
    network = arg$.network, address = arg$.address;
    return toEthAddress(address, function(err, address){
      var apiUrl, module, action, startblock, endblock, page, offset, sort, apikey, query;
      if (err != null) {
        return cb(err);
      }
      apiUrl = network.api.apiUrl;
      module = 'contract';
      action = 'getabi';
      startblock = 0;
      endblock = 99999999;
      page = 1;
      offset = 20;
      sort = 'desc';
      apikey = '4TNDAGS373T78YJDYBFH32ADXPVRMXZEIG';
      query = stringify({
        module: module,
        action: action,
        apikey: apikey,
        address: address
      });
      return get(apiUrl + "?" + query).timeout({
        deadline: deadline
      }).end(function(err, resp){
        var ref$;
        if (err != null) {
          return cb("cannot execute query - err " + ((ref$ = err.message) != null ? ref$ : err));
        }
        return jsonParse(resp.text, function(err, result){
          var ref$, txs;
          if (err != null) {
            return cb("cannot parse json: " + ((ref$ = err.message) != null ? ref$ : err));
          }
          if (toString$.call(result != null ? result.result : void 8).slice(8, -1) !== 'Array') {
            return cb("Unexpected result");
          }
          txs = map(transformTx(network, 'external'))(
          result.result);
          return cb(null, txs);
        });
      });
    });
  };
  getDec = commonProvider.getDec;
  out$.calcGasPrice = calcGasPrice = function(arg$, cb){
    var feeType, network, gasPrice;
    feeType = arg$.feeType, network = arg$.network, gasPrice = arg$.gasPrice;
    if (gasPrice != null) {
      return cb(null, gasPrice);
    }
    return makeQuery(network, 'eth_gasPrice', [], function(err, price){
      var ref$;
      if (err != null) {
        return cb("calc gas price - err: " + ((ref$ = err.message) != null ? ref$ : err));
      }
      price = fromHex(price);
      return cb(null, price);
    });
  };
  tryGetLatest = function(arg$, cb){
    var network, account;
    network = arg$.network, account = arg$.account;
    return toEthAddress(account.address, function(err, address){
      if (err != null) {
        return cb(err);
      }
      return makeQuery(network, 'eth_getTransactionCount', [address, "latest"], function(err, nonce){
        var ref$, next;
        if (err != null) {
          return cb("cannot get nonce (latest) - err: " + ((ref$ = err.message) != null ? ref$ : err));
        }
        next = +fromHex(nonce);
        return cb(null, next);
      });
    });
  };
  getNonce = function(arg$, cb){
    var network, account;
    network = arg$.network, account = arg$.account;
    return toEthAddress(account.address, function(err, address){
      if (err != null) {
        return cb(err);
      }
      return makeQuery(network, 'eth_getTransactionCount', [address, 'pending'], function(err, nonce){
        var ref$;
        if (err != null && (((ref$ = err.message) != null ? ref$ : err) + "").indexOf('not implemented') > -1) {
          return tryGetLatest({
            network: network,
            account: account
          }, cb);
        }
        if (err != null) {
          return cb("cannot get nonce (pending) - err: " + ((ref$ = err.message) != null ? ref$ : err));
        }
        return cb(null, fromHex(nonce));
      });
    });
  };
  isAddress = function(address){
    if (!/^(0x)?[0-9a-f]{40}$/i.test(address)) {
      return false;
    } else {
      return true;
    }
  };
  getContractInstance = commonProvider.getContractInstanceWithAbi(
    commonProvider.ERC20_ABI
  );
  out$.createTransaction = createTransaction = curry$(function(config, cb){
    var network, account, recipient, amount, amountFee, data, feeType, txType, gasPrice, gas, privateKey;
    network = config.network, account = config.account, recipient = config.recipient, amount = config.amount, amountFee = config.amountFee, data = config.data, feeType = config.feeType, txType = config.txType, gasPrice = config.gasPrice, gas = config.gas;
    if (!isAddress(recipient)) {
      return cb("address in not correct ethereum address");
    }
    privateKey = new Buffer(account.privateKey.replace(/^0x/, ''), 'hex');
    return commonProvider.web3EthGetTransactionCount(
      { address: account.address, status: 'pending', network },
      function (err, { nonce, web3 }) {
      var contract, toWei, toWeiEth, toEth, value;
      if (err != null) {
        return cb(err);
      }
      if (nonce == null) {
        return cb("nonce is required");
      }
      contract = getContractInstance(web3, network);
      toWei = function(it){
        return times(it, Math.pow(10, network.decimals));
      };
      toWeiEth = function(it){
        return times(it, Math.pow(10, 18));
      };
      toEth = function(it){
        return div(it, Math.pow(10, 18));
      };
      value = toWei(amount);
      return calcGasPrice({
        feeType: feeType,
        network: network,
        gasPrice: gasPrice
      }, function(err, gasPrice){
        if (err != null) {
          return cb(err);
        }
        return getGasEstimate({
          network: network,
          feeType: feeType,
          account: account,
          amount: amount,
          to: recipient,
          data: data,
          gas: gas
        }, function(err, gasEstimate){
          var onePercent, $gasEstimate, res;
          if (err != null) {
            return cb(err);
          }
          onePercent = times(gasEstimate, "0.01");
          $gasEstimate = plus(gasEstimate, onePercent);
          res = $gasEstimate.split(".");
          $gasEstimate = (function(){
            switch (false) {
            case res.length !== 2:
              return res[0];
            default:
              return $gasEstimate;
            }
          }());
          return getEthBalance({
            network: network,
            address: account.address
          }, function(err, balance){
            var feeIn;
            if (err != null) {
              return cb(err);
            }
            feeIn = network.txFeeIn.toUpperCase();
            return makeQuery(network, 'eth_chainId', [], function(err, chainId){
              var $data, $recipient, configs, tx, rawtx;
              if (err != null) {
                return cb(err);
              }
              if (+balance < +amountFee) {
                return cb("Not enought balance on " + feeIn + " wallet to send tx with fee " + amountFee);
              }
              $data = (function(){
                switch (false) {
                case !(config.data != null && config.data !== "0x"):
                  return config.data;
                case contract.methods == null:
                  return contract.methods.transfer(recipient, value).encodeABI();
                default:
                  return contract.transfer.getData(recipient, value);
                }
              }());
              $recipient = (function(){
                switch (false) {
                case !(config.data == null || config.data === "0x"):
                  return network.address;
                default:
                  return recipient;
                }
              }());
              configs = {
                nonce: toHex(nonce),
                gasPrice: toHex(gasPrice),
                value: toHex("0"),
                gas: toHex($gasEstimate),
                to: $recipient,
                from: account.address,
                data: $data,
                chainId: chainId
              };
              tx = new Tx(configs);
              tx.sign(privateKey);
              rawtx = '0x' + tx.serialize().toString('hex');
              return cb(null, {
                rawtx: rawtx
              });
            });
          });
        });
      });
    });
  });
  out$.checkDecodedData = checkDecodedData = function(decodedData, data){
    if (!(decodedData != null ? decodedData : "").length === 0) {
      return false;
    }
    if (!(data != null ? data : "").length === 0) {
      return false;
    }
  };
  out$.pushTx = pushTx = curry$(function(arg$, cb){
    var network, rawtx;
    network = arg$.network, rawtx = arg$.rawtx;
    return makeQuery(network, 'eth_sendRawTransaction', [rawtx], function(err, txid){
      var ref$;
      if (err != null) {
        return cb("cannot get signed tx - err: " + ((ref$ = err.message) != null ? ref$ : err));
      }
      return cb(null, txid);
    });
  });
  out$.checkTxStatus = checkTxStatus = function(arg$, cb){
    var network, tx;
    network = arg$.network, tx = arg$.tx;
    return cb("Not Implemented");
  };
  out$.getTotalReceived = getTotalReceived = function(arg$, cb){
    var address, network;
    address = arg$.address, network = arg$.network;
    return getTransactions({
      address: address,
      network: network
    }, function(err, txs){
      if (err != null) {
        return cb(err);
      }
      return toEthAddress(account.address, function(err, address){
        var total;
        if (err != null) {
          return cb(err);
        }
        total = foldl(plus, 0)(
        map(function(it){
          return it.amount;
        })(
        filter(function(it){
          return it.to.toUpperCase() === address.toUpperCase();
        })(
        txs)));
        return cb(null, total);
      });
    });
  };
  out$.getUnconfirmedBalance = getUnconfirmedBalance = function(arg$, cb){
    var network, address;
    network = arg$.network, address = arg$.address;
    return toEthAddress(address, function(err, address){
      if (err != null) {
        return cb(err);
      }
      return makeQuery(network, 'eth_getBalance', [address, 'pending'], function(err, number){
        var dec, balance;
        if (err != null) {
          return cb(err);
        }
        dec = getDec(network);
        balance = div(number, dec);
        return cb(null, balance);
      });
    });
  };
  getWeb3 = commonProvider.getWeb3;
  out$.getBalance = getBalance = commonProvider.getBalance;
  out$.getEthBalance = getEthBalance = function(arg$, cb){
    var network, address;
    network = arg$.network, address = arg$.address;
    return makeQuery(network, 'eth_getBalance', [address, 'latest'], function(err, number){
      var balance;
      if (err != null) {
        return cb(err);
      }
      balance = div(number, Math.pow(10, 18));
      return cb(null, balance);
    });
  };
  out$.getSyncStatus = getSyncStatus = function(arg$, cb){
    var network;
    network = arg$.network;
    return makeQuery(network, 'eth_getSyncing', [], function(err, estimate){
      if (err != null) {
        return cb(err);
      }
      return cb(null, estimate);
    });
  };
  out$.getPeerCount = getPeerCount = function(arg$, cb){
    var network;
    network = arg$.network;
    return makeQuery(network, 'net_getPeerCount', [], function(err, estimate){
      if (err != null) {
        return cb(err);
      }
      return cb(null, estimate);
    });
  };
  out$.getMarketHistoryPrices = getMarketHistoryPrices = function(config, cb){
    var network, coin, market;
    network = config.network, coin = config.coin;
    market = coin.market;
    return get(market).timeout({
      deadline: deadline
    }).end(function(err, resp){
      var ref$;
      if (err != null) {
        return cb("cannot execute query - err " + ((ref$ = err.message) != null ? ref$ : err));
      }
      return jsonParse(resp.text, function(err, result){
        if (err != null) {
          return cb(err);
        }
        return cb(null, result);
      });
    });
  };
  function curry$(f, bound){
    var context,
    _curry = function(args) {
      return f.length > 1 ? function(){
        var params = args ? args.concat() : [];
        context = bound ? context || this : this;
        return params.push.apply(params, arguments) <
            f.length && arguments.length ?
          _curry.call(context, params) : f.apply(context, params);
      } : f;
    };
    return _curry();
  }
}).call(this);
