// Generated by LiveScript 1.6.0
(function(){
  var fetch, stringify, jsonParse, jsonStringify, asCallback, formEncoded, getBody, makeBody, getType, clearTimer, resetRequest, getCbWithDeadline, makeCrossApi, makeTorApi, toString$ = {}.toString;
  fetch = require('cross-fetch');
  stringify = require('qs').stringify;
  jsonParse = function(text, cb){
    var err;
    try {
      return cb(null, JSON.parse(text));
    } catch (e$) {
      err = e$;
      return cb(err);
    }
  };
  jsonStringify = function(model, cb){
    var err;
    try {
      return cb(null, JSON.stringify(model));
    } catch (e$) {
      err = e$;
      return cb(err);
    }
  };
  asCallback = function(p, cb){
    p['catch'](function(err){
      return cb(err);
    });
    return p.then(function(data){
      return cb(null, data);
    });
  };
  formEncoded = function(data, cb){
    var res;
    res = stringify(data);
    return cb(null, res);
  };
  getBody = function(headers, data, cb){
    if (headers["Content-Type"] === "application/json") {
      return jsonStringify(data, cb);
    }
    if (headers["Content-Type"] === "application/x-www-form-urlencoded") {
      return formEncoded(data, cb);
    }
    return cb("header " + headers['Content-Type'] + " is not supported");
  };
  makeBody = function(method, headers, data, cb){
    if (method !== 'POST' && method !== 'PUT') {
      return cb(null);
    }
    return getBody(headers, data, function(err, body){
      if (err != null) {
        return cb(err);
      }
      return cb(null, {
        method: method,
        body: body,
        headers: headers
      });
    });
  };
  getType = function(type){
    switch (false) {
    case type !== "application/json":
      return "application/json";
    case type !== "json":
      return "application/json";
    case type !== "form":
      return "application/x-www-form-urlencoded";
    default:
      return type;
    }
  };
  clearTimer = function(cb){
    delete cb.timer;
    return clearTimeout(cb.timer);
  };
  resetRequest = function(cb){
    return function(){
      if (cb.timer == null) {
        return;
      }
      clearTimer(cb);
      return cb("Deadline was reached");
    };
  };
  getCbWithDeadline = function(timeout, cb){
    if (toString$.call(timeout.deadline).slice(8, -1) !== 'Number') {
      return cb("timeout.deadline is expected");
    }
    cb.timer = setTimeout(resetRequest(cb), timeout.deadline);
    return function(err, data){
      if (cb.timer == null) {
        return;
      }
      clearTimer(cb);
      return cb(err, data);
    };
  };
  makeCrossApi = function(method){
    return function(url, data){
      var $, headers;
      $ = {};
      headers = {
        "Content-Type": "application/json"
      };
      $._timeout = {
        deadline: 30000
      };
      $.type = function(type){
        return headers["Content-Type"] = getType(type);
      };
      $.timeout = function(timeout){
        $._timeout = timeout;
        return $;
      };
      $.set = function(header, value){
        headers[header] = value;
        return $;
      };
      $.end = function(fcb){
        var realData, cb;
        realData = data != null
          ? data
          : {};
        cb = getCbWithDeadline($._timeout, fcb);
        return makeBody(method, headers, realData, function(err, body){
          var p;
          if (err != null) {
            return cb(err);
          }
          p = fetch(url, body);
          return asCallback(p, function(err, data){
            if (err != null) {
              return cb(err);
            }
            if (data == null) {
              return cb("expected data");
            }
            return asCallback(data.text(), function(err, text){
              if (err != null) {
                return cb(err);
              }
              return jsonParse(text, function(err, body){
                if (err != null) {
                  return cb(err, {
                    text: text
                  });
                }
                cb(null, {
                  body: body,
                  text: text
                });
                return $;
              });
            });
          });
        });
      };
      return $;
    };
  };
  makeTorApi = function(method){
    return function(url, data){
      var $, headers;
      $ = {};
      headers = {
        "Content-Type": "application/json"
      };
      $.type = function(type){
        return headers["Content-Type"] = getType(type);
      };
      $.timeout = function(timeout){
        $._timeout = timeout;
        return $;
      };
      $.set = function(header, value){
        headers[header] = value;
        return $;
      };
      $.end = function(cb){
        var realData;
        realData = data != null
          ? data
          : {};
        return makeBody(method, headers, realData, function(err, body){
          if (err != null) {
            return cb(err);
          }
          tor.setTorAddress("localhost", "9050");
          return tor.request(url, body, function(err, res, text){
            return jsonParse(text, function(err, body){
              if (err != null) {
                return cb(err, {
                  text: text
                });
              }
              cb(null, {
                body: body,
                text: text
              });
              return $;
            });
          });
        });
      };
      return $;
    };
  };
  module.exports = {
    all: {
      post: makeCrossApi('POST'),
      get: makeCrossApi('GET'),
      put: makeCrossApi('PUT')
    },
    tor: {
      post: makeTorApi('POST'),
      get: makeTorApi('GET'),
      put: makeTorApi('PUT')
    },
    type: 'all'
  };
}).call(this);
