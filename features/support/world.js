var zombie = require('zombie');
var World = function World(callback) {
  this.browser = new zombie(); // this.browser will be available in step definitions
  
  this.settings = {
    "url": "http://test.commissar.dev",
    "debug": true
  };

  this.visit = function(url, callback) {
    if (this.settings.debug) {
      console.log("           visiting " + url);
    }
    this.browser.visit(url, callback);
  };

  callback(); // tell Cucumber we're finished and to use 'this' as the world instance
};
exports.World = World;