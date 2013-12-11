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
        if (typeof callback === 'undefined') {
            callback = noop;
        }
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
        if (typeof callback === 'undefined') {
            callback = noop;
        }
        http.request(
            extend(
                httpdefaults,
                {
                    path: path
                }
            ),
            function (res) {
                onComplete(res, function (body) {
                    if (JSON.parse(body) !== value) {
                        var postReq = http.request(
                            extend(
                                httpdefaults,
                                {
                                    path: path,
                                    method: "PUT"
                                }
                            ),
                            function (res) {
                                onComplete(res, function (body) {
                                    console.log("Updated " + path + " to " + value + " from " + body);
                                    callback();
                                });
                            }
                        );
                        console.log(path);
                        console.log(value);
                        console.log(JSON.stringify(value));
                        postReq.write(JSON.stringify(value));
                        postReq.end();
                    } else {
                        callback();
                    }
                });
            }
        ).end();
    }

    function ensureAdmin(username, password, callback) {
        if (typeof callback === 'undefined') {
            callback = noop;
        }
        http.request(
            extend(httpdefaults, {path: '/_config/admins'}),
            function (res) {
                onComplete(res, function (body) {
                    try {
                        body = JSON.parse(body);
                        if (body.error) {
                            throw body.error + ": " + body.reason;
                        }
                    } catch (err) {
                        console.error("Can't access /_config/admins", err);
                        return null;
                    }
                    if (!body[username]) {
                        var postReq = http.request(
                            extend(
                                httpdefaults,
                                {
                                    path: '/_config/admins/' + username,
                                    method: 'PUT'
                                }
                            ),
                            function (res) {
                                onComplete(res, function (body) {
                                    if (res.statusCode <= 299) {
                                        console.log("Created admin '" + username + "'");
                                        callback();
                                    } else {
                                        console.error("Could not create admin '" + username + "'", body);
                                    }
                                });
                            }
                        );
                        postReq.write(JSON.stringify(password));
                        postReq.end();
                    } else {
                        callback();
                    }
                });
            }
        ).end();
    }
    
    function ensureDatabase(database_name, callback) {
        if (typeof callback === 'undefined') {
            callback = noop;
        }
        http.request(
            extend(
                httpdefaults,
                {
                    path: '/' + database_name
                }
            ),
            function (res) {
                onComplete(res, function (body) {
                    try {
                        body = JSON.parse(body);
                    } catch (err) {
                        console.error("Cannot ensure database '" + database_name + "'", err);
                        return null;
                    }
                    if (body.error) {
                        if (body.error !== 'not_found') {
                            console.error("Cannot ensure database '" + database_name + "'", body);
                            return null;
                        }
                        http.request(
                            extend(
                                httpdefaults,
                                {
                                    path: "/" + database_name,
                                    method: "PUT"
                                }
                            ),
                            function (res) {
                                onComplete(res, function (body) {
                                    if (res.statusCode > 299) {
                                        console.error("Cannot ensure database '" + database_name + "'", body);
                                        return null;
                                    } else {
                                        console.log("Created database '" + database_name + "'");
                                        callback();
                                    }
                                });
                            }
                        ).end();
                    }
                    callback();
                });
            }
        ).end();
    }
    
    function ensureDatabaseSecurity(database_name, desired_security, callback) {
        if (typeof callback === 'undefined') {
            callback = noop;
        }
        ensureDatabase(database_name, function () {
            http.request(
                extend(
                    httpdefaults,
                    {
                        path: '/' + database_name + '/_security'
                    }
                ),
                function (res) {
                    onComplete(res, function (body) {
                        try {
                            body = JSON.parse(body);
                            if (body.error) {
                                throw body.error + ": " + body.reason;
                            }
                        } catch (err) {
                            console.error("Cannot secure database '" + database_name + "' as requested", err, body);
                        }
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
                        var putReq = http.request(
                            extend(
                                httpdefaults,
                                {
                                    path: '/' + database_name + "/_security",
                                    method: "put"
                                }
                            ),
                            function (res) {
                                onComplete(res, function (body) {
                                    if (res.statusCode <= 299) {
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
                                    }
                                    console.error("Could not update security on '" + database_name + "' to " + newBody, body);
                                    return null;
                                });
                            }
                        );
                        putReq.write(newBody);
                        putReq.end();
                    });
                }
            ).end();
        });
    }

    ensureAdmin(conf['adminuser'], conf['adminpass'], function () {
        foreach(conf.couchdb.config, function (key, val) {
            ensureConfig('/_config/' + key, val);
        });
        
        var databaseDeferreds = [];
        foreach(conf.couchdb.databases, function (key, val) {
            var deferred = q.defer();
            ensureDatabaseSecurity(key, val, function () {
                deferred.resolve(true);
            });
            databaseDeferreds.push(deferred.promise);
        });
        
        q.all(databaseDeferreds).then(function () {
            foreach(conf.couchdb.replications, function (index, replication) {
                ensureReplication(replication);
            });
        });
    });
    
})(require('http'), require("xtend"), require("./conf/couchdb.json"), require('os').hostname(), require('q'));
