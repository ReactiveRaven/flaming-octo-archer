(function() {
  var World, driver, path, protractor, ptor, webdriver;

  path = require('path');

  protractor = require('protractor');

  webdriver = require('selenium-webdriver');

  driver = new webdriver.Builder().usingServer('http://localhost:4444/wd/hub').withCapabilities(webdriver.Capabilities.chrome()).build();

  ptor = protractor.wrapDriver(driver);

  World = (function() {
    function World(callback) {
      this.browser = ptor;
      this.By = protractor.By;
      this.driver = driver;
      callback();
    }

    return World;

  })();

  module.exports.World = World;

}).call(this);
