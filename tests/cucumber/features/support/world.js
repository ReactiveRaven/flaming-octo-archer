var zombie = require('zombie');
var phantomProxy = require('phantom-proxy');
var World = function World(callback) {
  
  this.debug = true;
  
  this.phantomProxy = phantomProxy;
  
  this.settings = {
    "url": "http://test.commissar.dev",
    "debug": true
  };

  this.open = function(url, callback) {
    
    if (this.settings.debug) {
      this.log("notice", "visiting " + url);
    }
    
    return this.proxy.page.open(url, function () {callback(); });
  };
  
  this.log = function (level, message) {
    if (this.debug) {
      console.log("" + level + ": " + message);
    }
  }

  callback(); // tell Cucumber we're finished and to use 'this' as the world instance
};
exports.World = World;