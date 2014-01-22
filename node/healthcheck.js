//require('./utils/duckpunch_timedconsolelog'); // Logs times of console logs
//console = require('./utils/duckpunch_httplog'); // logs every http request made
(function (conf, q, foreach, ensure) {

    function echoError(err) {
        if (err) { console.error(err); }
        return !!err;
    }

    ensure.admin(conf['adminuser'], conf['adminpass'], function (err) {
        if (echoError(err)) { return null; }

        var configDeferreds = [];
        foreach(conf.couchdb.config, function (key, val) {
            var deferred = q.defer();
            ensure.config('/_config/' + key, val, function (err) {
                deferred.resolve(!echoError(err));
            });
            configDeferreds.push(deferred);
        });

        var databaseDeferreds = [];
        foreach(conf.couchdb.databases, function (key, val) {
            var deferred = q.defer();
            ensure.databaseSecurity(key, val, function (err) { echoError(err); deferred.resolve(true); });
            databaseDeferreds.push(deferred.promise);
        });

        var usersDeferreds = [];
        foreach(conf.couchdb.users, function (i, el) {
            var deferred = q.defer();
            ensure.user(el.username, el.password, el.roles, function (err, body) {
                deferred.resolve(echoError(err));
            });
        });
        
        q.all(databaseDeferreds).then(function () {
            var replicationDeferreds = [];
            
            foreach(conf.couchdb.replications, function (i, replication) {
                var deferred = q.defer();
                ensure.replication(replication, function (err) { echoError(err); deferred.resolve(true); });
                replicationDeferreds.push(deferred);
            });
            
            return q.all(replicationDeferreds);
        });
        
        var setUpUserDatabases = q.defer();
        q.all(databaseDeferreds.concat(usersDeferreds)).then(function () {
            ensure._makeRequest({path: '/_users/_all_docs'}, null, function (err, body) {
                if (echoError(err)) { return null; }
                
                var usernames = [];
                foreach (body.rows, function (i, el) {
                    if (el.id.match(/^org\.couchdb\.user\:.*/)) {
                        usernames.push(el.id.substr(17));
                    }
                });
                
                var deferreds = [];
                foreach (usernames, function (i, el) {
                    var deferred = q.defer();
                    deferreds.push(deferred);
                    var dbname = "commissar_user_" + el;
                    ensure.databaseSecurity(dbname, {
                        admins: {
                            names: [],
                            roles: ['+admin']
                        },
                        members: {
                            names: [el],
                            roles: ['+admin']
                        }
                    },
                    function (err, body) {
                        if (echoError(err)) { return null; }
                        deferred.resolve(true);
                    });
                    ensure.replication({
                        source: "commissar_validation_users",
                        target: dbname
                    }, echoError);
                });
                
                q.all(deferreds).then(function () {
                    setUpUserDatabases.resolve(true);
                });
            });
        });
        
        q.all(databaseDeferreds.concat(usersDeferreds)).then(function () {
            ensure._makeRequest({path: '/_all_dbs'}, null, function (err, body) {
                if (echoError(err)) { return null; }
                
                var userdbs = [];
                foreach (body, function (i, el) {
                    if (el.match(/^commissar_user_.+$/)) {
                        userdbs.push(el);
                    }
                });
                foreach(userdbs, function (i, dbname) {
                    var username = dbname.substring(15);
                    ensure.databaseSecurity(dbname, {
                        admins: {
                            names: [],
                            roles: ['+admin']
                        },
                        members: {
                            names: [username],
                            roles: ['+admin']
                        }
                    }, echoError);
                    ensure.replication({
                        source: "commissar_validation_users",
                        target: dbname
                    }, echoError);
                });
            });
        });

    });

})(require("./utils/conf"), require('q'), require('./utils/foreach'), require('./utils/configured_couchEnsure'));
