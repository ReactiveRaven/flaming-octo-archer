module.exports = (function () {
    "use strict";
    
    var foreach = require('./foreach');
    var extend = require('xtend');
    var http = require('http');
    
    function onComplete(res, callback) {
        if (!callback) { callback = noop; }

        var body = "";
        res.setEncoding("utf8");
        res.on("data", function (chunk) {
            body += ""+chunk;
        });
        res.on("end", function () {
            callback(body, res);
        });
    }
    
    return function (_httpdefaults_) {
        var httpdefaults = _httpdefaults_;
        return function (options, body, callback) {
            if (!callback) { callback = function () {}; }
            options = extend(
                httpdefaults,
                options
            );
            foreach(options, function (i, el) {
                if (el === null) {
                    delete options[i];
                }
            });

            var request = http.request(
                options,
                function (res) {
                    onComplete(res, function (inBody, response) {
                        if (res.headers['content-type']) {
                            switch (res.headers['content-type'].split(";")[0]) {
                                case 'application/json':
                                    try
                                    {
                                        inBody = JSON.parse(inBody);
                                    } catch (err) {
                                        callback(err);
                                    }
                                    break;
                                case 'text/plain':
                                    try
                                    {
                                        inBody = JSON.parse(inBody);
                                    } catch (err) {
                                        err = err; // ignore it! Its okay, just leave as text.
                                    }
                                    break;
                                default:
                                    console.warn("I don't understand content type " + res.headers['content-type']);
                                    break;
                            }
                        }

                        callback(null, inBody, response);
                    });
                }
            );
            if (body) {
                if (typeof body !== 'string') {
                    body = JSON.stringify(body);
                }
                request.write(body);
            }
            request.on("error", function (error) {
                callback(error);
            });
            request.end();
        };
    };

})();