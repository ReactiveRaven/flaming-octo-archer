(function() {
  var World, driver, protractor, ptor, webdriver;

  protractor = require('protractor');

  webdriver = require('selenium-webdriver');
  
  require("./css2xpath.min");

  driver = new webdriver.Builder().usingServer('http://localhost:4444/wd/hub').withCapabilities(webdriver.Capabilities.chrome()).build();

  ptor = protractor.wrapDriver(driver);

  World = (function() {
    function World(callback) {
      this.browser = ptor;
      this.By = protractor.By;
      this.driver = driver;
      this.css2xpath = css2xpath;
      callback();
    }

    return World;

  })();

  module.exports.World = World;

}).call(this);
