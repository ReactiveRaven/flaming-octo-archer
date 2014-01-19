var conf = require('./conf'),
    nano = require('nano');

module.exports = nano('http://' + conf.adminuser + ':' + conf.adminpass + '@localhost:5984');