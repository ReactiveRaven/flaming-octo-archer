require('./utils/duckpunch_httplog'); // logs every http request made
(function (conf, q, foreach, ensure) {

    function echoError(err) {
        if (err) { console.error(err); return true; }
    }

    ensure.admin(conf['adminuser'], conf['adminpass'], function (err) {
        if (echoError(err)) { return null; }

        foreach(conf.couchdb.config, function (key, val) {
            ensure.config('/_config/' + key, val, echoError);
        });

        var databaseDeferreds = [];
        foreach(conf.couchdb.databases, function (key, val) {
            var deferred = q.defer();
            ensure.databaseSecurity(key, val, function (err) { echoError(err); deferred.resolve(true); });
            databaseDeferreds.push(deferred.promise);
        });

        var replicationDeferreds = [];
        q.all(databaseDeferreds).then(function () {
            foreach(conf.couchdb.replications, function (i, replication) {
                var deferred = q.defer();
                ensure.replication(replication, function (err) { echoError(err); deferred.resolve(true); });
                replicationDeferreds.push(deferred);
            });

            makeRequest({path: '/_all_dbs'}, null, function (err, body) {
                if (echoError(err)) return null;
            });
        });

        foreach(conf.couchdb.users, function (i, el) {
            ensure.user(el.username, el.password, el.roles, function (err, body) {
                if (echoError(err)) { return null; }
            });
        });

    });

})(require("./utils/conf"), require('q'), require('./utils/foreach'), require('./utils/configured_couchEnsure'));
