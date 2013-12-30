var http, https, patcher;

patcher = function(patchMe) {
  var original;
  original = patchMe.request;
  return patchMe.request = function(options, callback) {
    console.log(options.path);
    return original(options, callback);
  };
};

http = require('http');

https = require('https');

patcher(http);

patcher(https);

module.exports = http;