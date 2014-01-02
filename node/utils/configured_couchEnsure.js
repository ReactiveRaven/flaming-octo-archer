var conf = require('./conf'),
    couchEnsure = require('../couchEnsure');

module.exports = couchEnsure({
    host: conf.url.split(":")[0],
    port: conf.url.split(":")[1],
    auth: conf['adminuser'] + ':' + conf['adminpass']
});
    