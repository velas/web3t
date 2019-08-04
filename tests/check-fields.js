// Generated by LiveScript 1.6.0
(function(){
  var types, fields, checkFields;
  types = require('./types.ls');
  fields = ['sendTransaction', 'createAccount', 'calcFee', 'getBalance', 'getHistory', 'sendAllFunds'];
  checkFields = function(web3t, cb){
    var coins;
    if (typeof err != 'undefined' && err !== null) {
      return cb(err);
    }
    coins = Object.keys(web3t);
    if (coins.filter(function(it){
      return !in$(it, types);
    }).length > 0) {
      return cb("Cannot find coins " + coins.join(','));
    }
    if (types.filter(function(it){
      return !in$(it, coins);
    }).length > 0) {
      return cb("Cannot find types");
    }
    if (coins.filter(function(t){
      return Object.keys(web3t[t]).filter(function(f){
        return !in$(f, fields);
      }).length > 0;
    }).length > 0) {
      return cb("Cannot find field in definition");
    }
    if (coins.filter(function(t){
      return fields.filter(function(f){
        return !in$(f, Object.keys(web3t[t]));
      }).length > 0;
    }).length > 0) {
      return cb("Cannot find fields");
    }
    return cb(null);
  };
  module.exports = checkFields;
  function in$(x, xs){
    var i = -1, l = xs.length >>> 0;
    while (++i < l) if (x === xs[i]) return true;
    return false;
  }
}).call(this);