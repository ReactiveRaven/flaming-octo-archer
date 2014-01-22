var foreach = require('./foreach');
var extend = require('xtend');
var http = require('http');

function onComplete(res, callback) {
    "use strict";

    if (!callback) { callback = function () {}; }

//    proxy_response.setEncoding('binary');
//    proxy_response.addListener('data', function(chunk){
//        response_body.write(chunk, current_byte_index, "binary");
//        current_byte_index += chunk.length;
//    });
//    proxy_response.addListener('end', function(){
//        res.contentType(filename);
//        res.send(response_body);
//    });

    var body = null,
        isBinary = res.headers['content-type'] && ['image'].indexOf(res.headers['content-type'].split("/")[0]) > -1,
        current_byte_index = 0;

    if (isBinary) {
        res.setEncoding("binary");
    } else {
        res.setEncoding("utf8");
    }
    res.on("data", function (chunk) {
        if (isBinary) {
            if (body === null) {
                body = new Buffer(parseInt(res.headers['Content-Length'], 10));
            }
            body.write(chunk, current_byte_index, "binary");
            current_byte_index += chunk.length;
        } else {
            if (body === null) {
                body = '';
            }
            body += '' + chunk;
        }
    });
    res.on("end", function () {
        callback(body, res);
    });
}

module.exports = function (_http_defaults_) {
    "use strict";

    var http_defaults = _http_defaults_;
    return function (options, body, callback) {
        if (!callback) { callback = function () {}; }
        options = extend(
            http_defaults,
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
                                    // ignore it! Its okay, just leave as text.
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