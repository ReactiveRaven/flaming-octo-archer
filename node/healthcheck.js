require('./utils/duckpunch_httplog'); // logs every http request made
(function (http, extend, conf, hostname, q) {

    if (typeof conf[hostname] === 'undefined') {
        hostname = 'default';
    }
    conf = conf[hostname];

    var host = conf.url.split(":")[0],
        port = conf.url.split(":")[1];

    var httpdefaults = {
        host: host,
        port: port,
        auth: conf['adminuser'] + ':' + conf['adminpass']
    };
    
    function noop() {}
    
    function foreach(object, callback) {
        for (var key in object) {
            if (object.hasOwnProperty(key)) {
                callback(key, object[key]);
            }
        }
    }
    
    function onComplete(res, callback) {
        if (!callback) { callback = noop; }
        
        var body = "";
        res.setEncoding("utf8");
        res.on("data", function (chunk) {
            body += ""+chunk;
        });
        res.on("end", function () {
            callback(body);
        });
    }

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

    function ensureAdmin(username, password, callback) {
        if (!callback) { callback = noop; }
        
        makeRequest({path: '/_config/admins'}, null, function (err, body) {
            if (err) { callback("Cannot ensure admin '" + username + "' :- " + JSON.stringify(err)); return null; }
            
            if (body.error) { callback("Can't access /_config/admins", body.error + ": " + body.reason); return null; }
            
            if (!body[username]) {
                makeRequest({path: '/_config/admins/' + username, method: 'PUT'}, JSON.stringify(password), function (err) {
                    if (err) { callback("Could not create admin '" + username + "' :- " + JSON.stringify(err)); return null; }
                    
                    console.log("Created admin '" + username + "'");
                    callback();
                });
            } else {
                callback();
            }
        });
    }
    
    function ensureDatabase(database_name, callback) {
        if (!callback) { callback = noop; }
        
        makeRequest({path: '/' + database_name}, null, function (err, body) {
            if (err) { callback("Cannot ensure database '" + database_name + "'", body); return null; }
            
            if (body.error) {
                if (body.error !== 'not_found') {
                    console.error("Cannot ensure database '" + database_name + "'", body);
                    callback();
                }
                
                makeRequest({path: "/" + database_name, method: "PUT"}, null, function (err, body) {
                    if (err) { callback("Cannot ensure database '" + database_name + "' :- " + JSON.stringify(err)); return null; }

                    console.log("Created database '" + database_name + "'");
                    callback();
                });
            }
            callback();
        });
    }
    
    function ensureDatabaseSecurity(database_name, desired_security, callback) {
        if (!callback) { callback = noop; }
        
        ensureDatabase(database_name, function (err) {
            if (err) { callback("Cannot secure database '" + database_name + "' as requested :- " + JSON.stringify(err)); return null; }
            
            makeRequest({path: '/' + database_name + '/_security'}, null, function (err, body) {
                if (err) { callback("Cannot secure database '" + database_name + "' as requested :- " + JSON.stringify(err)); return null; }
                
                if (body.error) {callback("Cannot secure database '" + database_name + "' as requested", body.error + ": " + body.reason); return null;}
                
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
            });
        });
    }
    
    function makeRequest(options, body, callback) {
        if (!callback) { callback = noop; }
        
        var request = http.request(
            extend(
                httpdefaults,
                options
            ),
            function (res) {
                onComplete(res, function (inBody) {
                    try
                    {
                        inBody = JSON.parse(inBody);
                    } catch (err) {
                        callback(err);
                    }
                    
                    callback(null, inBody);
                });
            }
        );
        if (body) {
            request.write(body);
        }
        request.end();
    }
    
    function ensureReplication(replication, callback) {
        if (!callback) { callback = noop; }
        
        var replicationId = replication.target + "__<--__" + replication.source;
        
        makeRequest({path: '/_replicator/' + replicationId}, null, function (err, body) {
            if (err) { console.error("Cannot ensure replication '" + JSON.stringify(replication) + "'", body); callback(); }
            
            if (body.error && body.error === "not_found") {
                var newDoc = {
                    '_id': replicationId,
                    'source': replication.source,
                    'target': replication.target,
                    'continuous': true,
                    'user_ctx': {
                        'name': conf.adminuser,
                        'roles': ['_admin']
                    }
                };
                makeRequest({path: '/_replicator/' + replicationId, method: 'PUT'}, JSON.stringify(newDoc), function (err, body) {
                    if (err) { callback("Cannot ensure replication " + replicationId + " :- " + JSON.stringify(err)); return null; }
                    
                    if (!body.ok) { callback("Cannot ensure replication " + replicationId, body); return null; }
                    
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
    
    function echoError(err) {
        if (err) { console.error(err); return true; }
    }

    ensureAdmin(conf['adminuser'], conf['adminpass'], function (err) {
        if (echoError(err)) { return null; }
        
        foreach(conf.couchdb.config, function (key, val) {
            ensureConfig('/_config/' + key, val, echoError);
        });
        
        var databaseDeferreds = [];
        foreach(conf.couchdb.databases, function (key, val) {
            var deferred = q.defer();
            ensureDatabaseSecurity(key, val, function (err) { echoError(err); deferred.resolve(true); });
            databaseDeferreds.push(deferred.promise);
        });
        
        var replicationDeferreds = [];
        q.all(databaseDeferreds).then(function () {
            foreach(conf.couchdb.replications, function (index, replication) {
                var deferred = q.defer();
                ensureReplication(replication, function (err) { echoError(err); deferred.resolve(true); });
                replicationDeferreds.push(deferred);
            });
            
            makeRequest({path: '/_all_dbs'}, null, function (err, body) {
                if (echoError(err)) return null;
            });
        });
    });
    
})(require('http'), require("xtend"), require("../conf/couchdb.json"), require('os').hostname(), require('q'));
