//require('./utils/duckpunch_httplog'); // logs every http request made
module.exports = (function (httpdefaults) {

    if (!httpdefaults.host) { throw 'httpdefaults.host not set'; }
    if (!httpdefaults.auth) { throw 'httpdefaults.auth not set'; }
    if (!httpdefaults.port) { throw 'httpdefaults.port not set'; }

    var foreach = require('./utils/foreach');
    var extend = require('xtend');
    var http = require('http');
    var makeRequest = require('./utils/makeRequest')(httpdefaults);

    var api = {};

    function noop() {}

    function ensureConfig(path, value, callback) {
        if (!callback) { callback = noop; }

        makeRequest({path: path}, null, function (err, body) {
            if (err) { callback("Cannot ensure config '" + path + "' = " + value + " :- " + JSON.stringify(err)); return null; }

            if (body !== value) {
                makeRequest({path: path, method: "PUT"}, JSON.stringify(value), function (err, body) {
                    if (err) { callback("Cannot ensure config '" + path + "' = " + value + " :- " + JSON.stringify(err)); return null; }

                    console.log("Updated " + path + " to " + value + " from " + body);
                    callback();
                });
            } else {
                callback();
            }
        });
    }
    api.config = ensureConfig;

    function ensureAdmin(username, password, callback, needAuth) {
        if (!callback) { callback = noop; }

        (function () {

            var ensureAdminOptions = {};
            if (!needAuth) {
                ensureAdminOptions.auth = null;
            }

            makeRequest(extend(ensureAdminOptions, {path: '/_config/admins'}), null, function (err, body) {
                if (err) { callback("Cannot ensure admin '" + username + "' :- " + JSON.stringify(err)); return null; }

                if (body.error === 'unauthorized') { ensureAdmin(username, password, callback, true); return null; }
                if (body.error) { callback("Can't access /_config/admins :- " + body.error + ": " + body.reason); return null; }

                if (!body[username]) {
                    makeRequest(extend(ensureAdminOptions, {path: '/_config/admins/' + username, method: 'PUT'}), JSON.stringify(password), function (err, body) {
                        if (err) { callback("Could not create admin '" + username + "' :- " + JSON.stringify(err)); return null; }
                        if (body.error) { callback("Could not create admin '" + username + "' :- " + JSON.stringify(body)); return null; }

                        console.log("Created admin '" + username + "'", body);
                        callback();
                    });
                } else {
                    callback();
                }
            });

        })();
    }
    api.admin = ensureAdmin;

    function ensureDatabase(database_name, callback) {
        if (!callback) { callback = noop; }

        makeRequest({path: '/' + database_name}, null, function (err, body) {
            if (err) { callback("Cannot ensure database '" + database_name + "' :- " + JSON.stringify(err)); return null; }

            if (body.error) {
                if (body.error !== 'not_found') { callback("Cannot ensure database '" + database_name + "' :- " + JSON.stringify(body)); return null; }

                makeRequest({path: "/" + database_name, method: "PUT"}, null, function (err, body) {
                    if (err && (!err.code || err.code !== 'ECONNRESET')) { callback("Cannot ensure database '" + database_name + "' :- " + JSON.stringify(err)); return null; }

                    if (body && !body.ok) { callback("Cannot ensure database '" + database_name + "' :- " + JSON.stringify(body)); return null; }

                    (function () {
                        var internalCallback = function () {
                            makeRequest({path: '/' + database_name}, null, function (err, body) {
                                if (err) { callback("Cannot ensure database '" + database_name + "' during verify :- " + JSON.stringify(err)); return null; }

                                console.log("Created database '" + database_name + "'");
                                callback();
                            });
                        };
                        setTimeout(internalCallback, 100);
                    })();
                });
            } else {
                callback();
            }
        });
    }
    api.database = ensureDatabase;

    function ensureDatabaseSecurity(database_name, desired_security, callback) {
        if (!callback) { callback = noop; }

        ensureDatabase(database_name, function (err) {
            if (err) { callback("Cannot secure database '" + database_name + "' as requested :- " + JSON.stringify(err)); return null; }

            makeRequest({path: '/' + database_name + '/_security'}, null, function (err, body) {
                if (err) { callback("Cannot secure database '" + database_name + "' as requested :- " + JSON.stringify(err)); return null; }

                if (body.error) {callback("Cannot secure database '" + database_name + "' as requested :- " + body.error + ": " + body.reason); return null;}

                var updates = [];
                for (var key in desired_security) {
                    if (desired_security.hasOwnProperty(key)) {
                        if (typeof body[key] === 'undefined') {
                            body[key] = [];
                            updates.push("Created key '" + key + "' as it was missing");
                        }
                        var oldString = JSON.stringify(body[key]),
                            newString = JSON.stringify(desired_security[key]);
                        if (oldString !== newString) {
                            updates.push("Updated '" + key + "' from " + oldString + " to " + newString);
                            body[key] = desired_security[key];
                        }
                    }
                }
                if (updates.length) {
                    var newBody = JSON.stringify(body);
                    makeRequest({path: '/' + database_name + "/_security", method: "put"}, newBody, function (err, body) {
                        if (err) { callback("Cannot secure database '" + database_name + "' as requested :- " + JSON.stringify(err)); return null; }

                        if (updates.length) {
                            console.log("Security on '" + database_name + "' was updated as follows:");
                            for (var key in updates) {
                                if (updates.hasOwnProperty(key)) {
                                    console.log("    " + updates[key]);
                                }
                            }
                        }
                        callback();
                        return null;
                    });
                } else {
                    callback();
                    return null;
                }
            });
        });
    }
    api.databaseSecurity = ensureDatabaseSecurity;

//    function makeRequest(options, body, callback) {
//        if (!callback) { callback = noop; }
//        options = extend(
//            httpdefaults,
//            options
//        );
//        foreach(options, function (i, el) {
//            if (el === null) {
//                delete options[i];
//            }
//        });
//
//        var request = http.request(
//            options,
//            function (res) {
//                onComplete(res, function (inBody) {
//                    try
//                    {
//                        inBody = JSON.parse(inBody);
//                    } catch (err) {
//                        callback(err);
//                    }
//
//                    callback(null, inBody);
//                });
//            }
//        );
//        if (body) {
//            if (typeof body !== 'string') {
//                body = JSON.stringify(body);
//            }
//            request.write(body);
//        }
//        request.on("error", function (error) {
//            callback(error);
//        });
//        request.end();
//    }
    api._makeRequest = makeRequest;

    function ensureUser(username, password, roles, callback) {
        if (!callback) { callback = noop; }

        makeRequest({path: '/_users/org.couchdb.user:' + username}, null, function (err, body) {
            if (err) { callback("Cannot ensure user '" + username + "' :- " + err); return null; }
            if (!body) { callback("Cannot ensure user '" + username + "' as body is falsy :- " + JSON.stringify(body)); return null; }

            if (body.error && body.error === "not_found") {
                var basicBody = {
                    'type': 'user',
                    '_id': 'org.couchdb.user:' . username,
                    'name': username,
                    'password': password,
                    'roles': roles
                };
                makeRequest({path: '/_users/org.couchdb.user:' + username, method: 'PUT'}, basicBody, function (err, body) {
                    if (err) { callback("Cannot ensure user '" + username + "' :- " + err); return null; }
                    if (!body.ok) { callback("Cannot ensure user '" + username + "' :- " + JSON.stringify(body)); return null; }

                    console.log("Created user '" + username + "' with roles " + JSON.stringify(basicBody.roles));

                    callback(null, true);
                });
            } else {
                var rolesMissing = [];
                foreach(roles, function (i, el) {
                    if (body.roles.indexOf(el) < 0) {
                        rolesMissing.push(el);
                    }
                });
                if (rolesMissing.length) {
                    var newBody = extend({}, body);
                    foreach(rolesMissing, function (i, el) {
                        newBody.roles.push(el);
                    });

                    makeRequest({path: '/_users/org.couchdb.user:' + username, method: 'PUT'}, newBody, function (err, body) {
                        if (err) { callback("Cannot ensure user '" + username + "' roles contain " + JSON.stringify(roles) + " :- " + err); return null; }

                        console.log("Updated user '" + username + "' roles to " + JSON.stringify(newBody.roles));
                        callback(null, true);
                    });
                } else {
                    callback(null, true);
                }
            }
        });
    }
    api.user = ensureUser;

    function ensureReplication(replication, callback) {
        if (!callback) { callback = noop; }

        var replicationId = replication.target + "__<--__" + replication.source;

        makeRequest({path: '/_replicator/' + replicationId}, null, function (err, body) {
            if (err) { callback("Cannot ensure replication '" + replicationId + "' :- " + err); return null; }
            if (!body) { callback("Cannot ensure replication '" + replicationId + "' as body is falsy :- " + JSON.stringify(body)); return null; }

            if (body.error && body.error === "not_found") {
                var newDoc = {
                    '_id': replicationId,
                    'source': replication.source,
                    'target': replication.target,
                    'continuous': true,
                    'user_ctx': {
                        'name': httpdefaults.auth.split(":")[0],
                        'roles': ['_admin']
                    }
                };
                makeRequest({path: '/_replicator/' + replicationId, method: 'PUT'}, JSON.stringify(newDoc), function (err, body) {
                    if (err) { callback("Cannot ensure replication " + replicationId + " :- " + JSON.stringify(err)); return null; }

                    if (!body.ok) { callback("Cannot ensure replication " + replicationId + "' :- " + JSON.stringify(body)); return null; }

                    console.log("Set up replication " + replicationId);

                    callback();
                });
            } else if (body._replication_state && body._replication_state !== 'triggered') {
                var newBody = extend({}, body);
                foreach(['state', 'state_time', 'id'], function (i, el) {
                    if (newBody['_replication_' + el]) { delete newBody['_replication_' + el]; }
                });
                makeRequest({path: '/_replicator/' + replicationId, method: 'PUT'}, JSON.stringify(newBody), function (err, replyBody) {
                    if (err) { callback("Cannot ensure replication " + replicationId + " :- " + JSON.stringify(err)); return null; }

                    if (!replyBody.ok) { callback("Cannot ensure replication " + replicationId + " :- " + JSON.stringify(err)); return null; }

                    console.log("Re-started replication '" + replicationId + "' from state '" + body._replication_state + "'");
                });
            } else {
                callback();
            }
        });
    }
    api.replication = ensureReplication;




    return api;
});