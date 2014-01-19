var conf = require('./conf');

module.exports = {
    host: conf.url.split(":")[0],
    port: conf.url.split(":")[1],
    auth: conf['adminuser'] + ':' + conf['adminpass']
};
    