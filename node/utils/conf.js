var conf = require('../../conf/couchdb.json'),
    hostname = require('os').hostname();
    
if (typeof conf[hostname] === 'undefined') {
    hostname = 'default';
}
conf = conf[hostname];

module.exports = conf;