const commonProvider = require("./common/provider");

(function () {
  var stringify,
    ref$,
    filter,
    map,
    foldl,
    each,
    uniqueBy,
    plus,
    minus,
    times,
    div,
    fromHex,
    $toHex,
    get,
    post,
    Web3,
    Tx,
    BN,
    hdkey,
    bip39,
    jsonParse,
    deadline,
    bignumber,
    getEthereumFullpairByIndex,
    getGasEstimate,
    calcFee,
    getKeys,
    round,
    toHex,
    transformTx,
    getTransactions,
    getDec,
    calcGasPrice,
    tryGetLateest,
    getNonce,
    isAddress,
    createTransaction,
    checkDecodedData,
    pushTx,
    checkTxStatus,
    getTotalReceived,
    getUnconfirmedBalance,
    getBalance,
    getMarketHistoryPrices,
    out$ = (typeof exports != "undefined" && exports) || this,
    toString$ = {}.toString;
  stringify = require("qs").stringify;
  (ref$ = require("prelude-ls")),
    (filter = ref$.filter),
    (map = ref$.map),
    (foldl = ref$.foldl),
    (each = ref$.each),
    (uniqueBy = ref$.uniqueBy);
  (ref$ = require("../math.js")),
    (plus = ref$.plus),
    (minus = ref$.minus),
    (times = ref$.times),
    (div = ref$.div),
    (fromHex = ref$.fromHex),
    ($toHex = ref$.$toHex);
  (ref$ = require("./superagent.js")), (get = ref$.get), (post = ref$.post);
  (ref$ = require("./deps.js")),
    (Web3 = ref$.Web3),
    (Tx = ref$.Tx),
    (BN = ref$.BN),
    (hdkey = ref$.hdkey),
    (bip39 = ref$.bip39);
  jsonParse = require("../json-parse.js");
  deadline = require("../deadline.js");
  bignumber = require("bignumber.js");

  const makeQuery = commonProvider.makeQuery;


  getEthereumFullpairByIndex = function (mnemonic, index, network) {
    var seed, wallet, w, address, privateKey, publicKey;
    seed = bip39.mnemonicToSeed(mnemonic);
    wallet = hdkey.fromMasterSeed(seed);
    w = wallet.derivePath("m0").deriveChild(index).getWallet();
    address = "0x" + w.getAddress().toString("hex");
    privateKey = w.getPrivateKeyString();
    publicKey = w.getPublicKeyString();
    return {
      address: address,
      privateKey: privateKey,
      publicKey: publicKey,
    };
  };

  getGasEstimate = function (config, cb) {
    var network,
      feeType,
      account,
      amount,
      to,
      data,
      dec,
      from,
      $data,
      val,
      value,
      query;
    (network = config.network),
      (feeType = config.feeType),
      (account = config.account),
      (amount = config.amount),
      (to = config.to),
      (data = config.data);
    if (+amount === 0) {
      return cb(null, "0");
    }
    dec = getDec(network);
    from = account.address;
    $data = (function () {
      switch (false) {
        case !(data != null && data !== "0x"):
          return data;
        default:
          return "0x";
      }
    })();
    val = times(amount, dec);
    value = $toHex(val);
    query = {
      from: from,
      to: to,
      data: $data,
      value: value,
    };
    return makeQuery(
      network,
      "eth_estimateGas",
      [query],
      function (err, estimate) {
        if (err != null) {
          console.error("get-gas-estimate error:", err);
        }
        if (err != null) {
          return cb(null, "0");
        }
        return cb(null, fromHex(estimate));
      }
    );
  };
  out$.calcFee = calcFee = function (arg$, cb) {
    var network, feeType, account, amount, to, data, gas, gasPrice, dec;
    (network = arg$.network),
      (feeType = arg$.feeType),
      (account = arg$.account),
      (amount = arg$.amount),
      (to = arg$.to),
      (data = arg$.data),
      (gas = arg$.gas),
      (gasPrice = arg$.gasPrice);
    if (feeType !== "auto") {
      return cb(null);
    }
    dec = getDec(network);
    return calcGasPrice(
      {
        feeType: feeType,
        network: network,
        gasPrice: gasPrice,
      },
      function (err, gasPrice) {
        var value, dataParsed, from, query;
        if (err != null) {
          return cb(err);
        }
        value = (function () {
          switch (false) {
            case amount == null:
              return times(amount, dec);
            default:
              return 0;
          }
        })();
        dataParsed = (function () {
          switch (false) {
            case data == null:
              return data;
            default:
              return "0x";
          }
        })();
        from = account.address;
        query = {
          from: from,
          to: account.address,
          data: dataParsed,
        };
        return getGasEstimate(
          {
            network: network,
            feeType: feeType,
            account: account,
            amount: amount,
            to: to,
            data: dataParsed,
            gas: gas,
          },
          function (err, estimate) {
            var res, val, fee;
            if (err != null) {
              return cb(null, {
                calcedFee: network.txFee,
                gasPrice: gasPrice,
              });
            }
            res = times(gasPrice, estimate);
            val = div(res, dec);
            fee = new bignumber(val).toFixed(18);
            return cb(null, {
              calcedFee: fee,
              gasPrice: gasPrice,
              gasEstimate: estimate,
            });
          }
        );
      }
    );
  };
  out$.getKeys = getKeys = function (arg$, cb) {
    var network, mnemonic, index, result;
    (network = arg$.network), (mnemonic = arg$.mnemonic), (index = arg$.index);
    result = getEthereumFullpairByIndex(mnemonic, index, network);
    return cb(null, result);
  };
  round = function (num) {
    return Math.round(+num);
  };
  toHex = function (it) {
    return new BN(it);
  };
  transformTx = curry$(function (network, t) {
    var url, dec, tx, amount, time, fee;
    url = network.api.url;
    dec = getDec(network);
    network = "eth";
    tx = t.hash;
    amount = div(t.value, dec);
    time = t.timeStamp;
    url = url + "/tx/" + tx;
    fee = (function () {
      var ref$;
      switch (false) {
        case t.gasUsed == null:
          return div(times(t.gasUsed, t.gasPrice), dec);
        default:
          return div(
            times(
              (ref$ = t != null ? t.cumulativeGasUsed : void 8) != null
                ? ref$
                : 0,
              t.gasPrice
            ),
            dec
          );
      }
    })();
    return {
      network: network,
      tx: tx,
      amount: amount,
      fee: fee,
      time: time,
      url: url,
      from: t.from,
      to: t.to,
    };
  });
  out$.getTransactions = getTransactions = function (arg$, cb) {
    var network,
      address,
      apiUrl,
      module,
      action,
      startblock,
      endblock,
      sort,
      apikey,
      query;
    (network = arg$.network), (address = arg$.address);
    apiUrl = network.api.apiUrl;
    module = "account";
    action = "txlist";
    startblock = 0;
    endblock = 99999999;
    sort = "asc";
    apikey = "4TNDAGS373T78YJDYBFH32ADXPVRMXZEIG";
    query = stringify({
      module: module,
      action: action,
      apikey: apikey,
      address: address,
      sort: sort,
      startblock: startblock,
      endblock: endblock,
    });
    return get(apiUrl + "?" + query)
      .timeout({
        deadline: deadline,
      })
      .end(function (err, resp) {
        var ref$;
        if (err != null) {
          return cb(
            "cannot execute query - err " +
              ((ref$ = err.message) != null ? ref$ : err)
          );
        }
        return jsonParse(resp.text, function (err, result) {
          var ref$, txs;
          if (err != null) {
            return cb(
              "cannot parse json: " +
                ((ref$ = err.message) != null ? ref$ : err)
            );
          }
          if (
            toString$
              .call(result != null ? result.result : void 8)
              .slice(8, -1) !== "Array"
          ) {
            return cb("Unexpected result");
          }
          txs = map(transformTx(network))(
            uniqueBy(function (it) {
              return it.hash;
            })(result.result)
          );
          return cb(null, txs);
        });
      });
  };
  getDec = commonProvider.getDec;
  calcGasPrice = function (arg$, cb) {
    var feeType, network, gasPrice;
    (feeType = arg$.feeType),
      (network = arg$.network),
      (gasPrice = arg$.gasPrice);
    if (feeType === "cheap") {
      return cb(null, "3000000000");
    }
    if (gasPrice != null) {
      return cb(null, gasPrice);
    }
    return makeQuery(network, "eth_gasPrice", [], function (err, price) {
      var ref$;
      if (err != null) {
        return cb(
          "calc gas price - err: " + ((ref$ = err.message) != null ? ref$ : err)
        );
      }
      price = fromHex(price);
      if (+price === 0) {
        return cb(null, 8);
      }
      return cb(null, price);
    });
  };
  tryGetLateest = function (arg$, cb) {
    var network, account;
    (network = arg$.network), (account = arg$.account);
    return makeQuery(
      network,
      "eth_getTransactionCount",
      [account.address, "latest"],
      function (err, nonce) {
        var ref$, next;
        if (err != null) {
          return cb(
            "cannot get nonce (latest) - err: " +
              ((ref$ = err.message) != null ? ref$ : err)
          );
        }
        next = +fromHex(nonce);
        return cb(null, next);
      }
    );
  };
  getNonce = function (arg$, cb) {
    var network, account;
    (network = arg$.network), (account = arg$.account);
    return makeQuery(
      network,
      "eth_getTransactionCount",
      [account.address, "pending"],
      function (err, nonce) {
        var ref$;
        if (
          err != null &&
          (((ref$ = err.message) != null ? ref$ : err) + "").indexOf(
            "not implemented"
          ) > -1
        ) {
          return tryGetLateest(
            {
              network: network,
              account: account,
            },
            cb
          );
        }
        if (err != null) {
          return cb(
            "cannot get nonce (pending) - err: " +
              ((ref$ = err.message) != null ? ref$ : err)
          );
        }
        return cb(null, fromHex(nonce));
      }
    );
  };
  isAddress = function (address) {
    if (!/^(0x)?[0-9a-f]{40}$/i.test(address)) {
      return false;
    } else {
      return true;
    }
  };
  out$.createTransaction = createTransaction = curry$(function (arg$, cb) {
    var network,
      account,
      recipient,
      amount,
      amountFee,
      data,
      feeType,
      txType,
      chainId,
      gasPrice,
      dec,
      privateKey;
    (network = arg$.network),
      (account = arg$.account),
      (recipient = arg$.recipient),
      (amount = arg$.amount),
      (amountFee = arg$.amountFee),
      (data = arg$.data),
      (feeType = arg$.feeType),
      (txType = arg$.txType),
      (chainId = arg$.chainId),
      (gasPrice = arg$.gasPrice);
    dec = getDec(network);
    if (!isAddress(recipient)) {
      return cb("address is not correct ethereum address");
    }
    privateKey = new Buffer(account.privateKey.replace(/^0x/, ""), "hex");
    return getNonce(
      {
        account: account,
        network: network,
      },
      function (err, nonce) {
        var toWei, toEth, value;
        if (err != null) {
          return cb(err);
        }
        toWei = function (it) {
          return times(it, dec);
        };
        toEth = function (it) {
          return div(it, dec);
        };
        value = toWei(amount);
        return calcGasPrice(
          {
            feeType: feeType,
            network: network,
            gasPrice: gasPrice,
          },
          function (err, gasPrice) {
            if (err != null) {
              return cb(err);
            }
            return getGasEstimate(
              {
                network: network,
                feeType: feeType,
                account: account,
                amount: amount,
                to: recipient,
                data: data,
              },
              function (err, gasEstimate) {
                if (err != null) {
                  return cb(err);
                }
                return makeQuery(
                  network,
                  "eth_getBalance",
                  [account.address, "latest"],
                  function (err, balance) {
                    var balanceEth, toSend, tx, rawtx;
                    if (err != null) {
                      return cb(err);
                    }
                    balanceEth = toEth(balance);
                    toSend = plus(amount, amountFee);
                    if (+balanceEth < +toSend) {
                      return cb(
                        "Balance " +
                          balanceEth +
                          " is not enough to send tx " +
                          toSend
                      );
                    }
                    tx = new Tx({
                      nonce: toHex(nonce),
                      gasPrice: toHex(gasPrice),
                      value: $toHex(value),
                      gas: toHex(gasEstimate),
                      to: recipient,
                      from: account.address,
                      data: data || "0x",
                      chainId: chainId,
                    });
                    tx.sign(privateKey);
                    rawtx = "0x" + tx.serialize().toString("hex");
                    return cb(null, {
                      rawtx: rawtx,
                    });
                  }
                );
              }
            );
          }
        );
      }
    );
  });
  out$.checkDecodedData = checkDecodedData = function (decodedData, data) {
    if (!(decodedData != null ? decodedData : "").length === 0) {
      return false;
    }
    if (!(data != null ? data : "").length === 0) {
      return false;
    }
  };
  out$.pushTx = pushTx = curry$(function (arg$, cb) {
    var network, rawtx;
    (network = arg$.network), (rawtx = arg$.rawtx);
    return makeQuery(
      network,
      "eth_sendRawTransaction",
      [rawtx],
      function (err, txid) {
        var ref$;
        if (err != null) {
          return cb(
            "cannot get signed tx - err: " +
              ((ref$ = err.message) != null ? ref$ : err)
          );
        }
        return cb(null, txid);
      }
    );
  });
  out$.checkTxStatus = checkTxStatus = function (arg$, cb) {
    var network, tx;
    (network = arg$.network), (tx = arg$.tx);
    return cb("Not Implemented");
  };
  out$.getTotalReceived = getTotalReceived = function (arg$, cb) {
    var address, network;
    (address = arg$.address), (network = arg$.network);
    return getTransactions(
      {
        address: address,
        network: network,
      },
      function (err, txs) {
        var total;
        total = foldl(
          plus,
          0
        )(
          map(function (it) {
            return it.amount;
          })(
            filter(function (it) {
              return it.to.toUpperCase() === address.toUpperCase();
            })(txs)
          )
        );
        return cb(null, total);
      }
    );
  };
  out$.getUnconfirmedBalance = getUnconfirmedBalance = function (arg$, cb) {
    var network, address;
    (network = arg$.network), (address = arg$.address);
    return makeQuery(
      network,
      "eth_getBalance",
      [address, "pending"],
      function (err, number) {
        var dec, balance;
        if (err != null) {
          return cb(err);
        }
        dec = getDec(network);
        balance = div(number, dec);
        return cb(null, balance);
      }
    );
  };
  out$.getBalance = getBalance = function (arg$, cb) {
    var network, address;
    (network = arg$.network), (address = arg$.address);
    return makeQuery(
      network,
      "eth_getBalance",
      [address, "latest"],
      function (err, number) {
        var dec, balance;
        if (err != null) {
          return cb(err);
        }
        dec = getDec(network);
        balance = div(number, dec);
        return cb(null, balance);
      }
    );
  };
  out$.getMarketHistoryPrices = getMarketHistoryPrices = function (config, cb) {
    var network, coin, market;
    (network = config.network), (coin = config.coin);
    market = coin.market;
    return get(market)
      .timeout({
        deadline: deadline,
      })
      .end(function (err, resp) {
        var ref$;
        if (err != null) {
          return cb(
            "cannot execute query - err " +
              ((ref$ = err.message) != null ? ref$ : err)
          );
        }
        return jsonParse(resp.text, function (err, result) {
          if (err != null) {
            return cb(err);
          }
          return cb(null, result);
        });
      });
  };
  function curry$(f, bound) {
    var context,
      _curry = function (args) {
        return f.length > 1
          ? function () {
              var params = args ? args.concat() : [];
              context = bound ? context || this : this;
              return params.push.apply(params, arguments) < f.length &&
                arguments.length
                ? _curry.call(context, params)
                : f.apply(context, params);
            }
          : f;
      };
    return _curry();
  }
}.call(this));
