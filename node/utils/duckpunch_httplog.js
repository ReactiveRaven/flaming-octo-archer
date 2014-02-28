var http, https, patcher;

require('colors');

patcher = function(patchMe) {
  var original;
  original = patchMe.request;
  return patchMe.request = function(options, callback) {
      var method = options.method ? options.method : "GET";
    console.log(method.toUpperCase().grey + " " + options.path.grey + " " + (JSON.stringify(options.headers) + "").cyan);
    return original(options, callback);
  };
};

http = require('http');

https = require('https');

patcher(http);

patcher(https);

module.exports = http;