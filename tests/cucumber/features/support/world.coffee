path = require 'path'

protractor = require 'protractor'
webdriver = require 'selenium-webdriver'

driver = new webdriver.Builder().
  usingServer('http://localhost:4444/wd/hub').
  withCapabilities(webdriver.Capabilities.chrome()).
  build()

ptor = protractor.wrapDriver driver

class World
  constructor: (callback) ->
    @browser = ptor
    @By = protractor.By
    @driver = driver
    
    callback()

module.exports.World = World