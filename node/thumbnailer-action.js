var module = module;
module.exports = (function (request, fs, conf, uuid, easyimg, mmm, deferred) {
    "use strict";

    var baseurl = "http://" + conf.url + "/";
    var magic = new mmm.Magic(mmm.MAGIC_MIME_TYPE);

    return function (inPipe, document, file, width, height, crop, outPipe) {
//        var loggedIn = q.defer();
        var key = "__thumb_" + (width ? 'w' + width : '') + (height ? 'h' + height : '') + (crop ? 'crop' : '');
        var path = baseurl + document + "/" + file;
        var docpath = baseurl + document;
        var jar = request.jar();
        jar.setCookie("AuthSession=" + inPipe.cookies['AuthSession'], baseurl);

        request({
                uri: path + key,
                method: 'GET',
                jar: jar,
                headers: inPipe.headers,
                encoding: null
            },
            function (error, response, body) {
                if (response.statusCode === 200 || response.statusCode === 304) {
                    // OK! Just send the thumb.
                    outPipe.set(response.headers);
                    outPipe.set("cache-control", "private, max-age=86400");
                    outPipe.send(body, response.statusCode);
                    console.log("cached " + response.statusCode + ": " + path + key);
                } else {
                    // Gosh. Fine. I'll build the thumb then.
                    console.log("generating: " + path + key);
                    console.log("status code: " + response.statusCode);
                    var filename = '/tmp/thumbnailer-' + uuid.v4();
                    var deferredRev = (function () {
                        var def = deferred();
                        request({ uri: docpath, method: 'HEAD', jar: jar }, function (err, response, body) {
                            def.resolve(JSON.parse(response.headers['etag']));
                        });

                        return def.promise;
                    }());

                    request({
                        uri: path,
                        method: 'GET',
                        jar: jar,
                        encoding: null
                    }).pipe(fs.createWriteStream(filename)).on(
                        "close",
                        function () {
                            easyimg.thumbnail({src: filename, dst: filename + "_out", width: width}, function (info) {
                                magic.detectFile(filename + "_out", function (err, type) {
                                    var contents = fs.readFileSync(filename + "_out");

                                    outPipe.set("Content-Type", type);
                                    outPipe.end(contents, "binary");

                                    fs.unlink(filename);
                                    fs.unlink(filename + "_out");

                                    deferredRev.then(function (rev) {
                                        request({
                                            uri: path + key,
                                            qs: {
                                                rev: rev
                                            },
                                            method: 'PUT',
                                            headers: {
                                                'Content-Type': type
                                            },
                                            jar: jar,
                                            encoding: 'binary',
                                            body: contents
                                        }, function (err, response, body) {
                                        });
                                        console.log(rev);
                                    });
                                });
                            });
                        }
                    );
                }
            }
        );

//        outPipe.set(response.headers);
//        outPipe.send(body);

//        request.head(path /**/ + "__" + key/**/, function (error, response) {
//            if (response.statusCode === "OK") {
//                request.get(path + "__" + key).pipe(pipe);
//            } else {
//                request.head(path, function (error, response) {
//                    if (response.statusCode !== 'OK') {
//                        pipe.status(404).send('Not found ' + path);
//                    } else {
//                        pipe.send("WARK");
//                    }
//                });
//            }
//        });
    };
}(require('request'), require('fs'), require('./utils/conf'), require('node-uuid'), require('easyimage'), require('mmmagic'), require('deferred')));



//request.get('http://' + httpdefaults.auth + '@' + httpdefaults.host + ':' + httpdefaults.port + '/' + req.params.db + "/" + req.params.id + "/" + req.params.file).pipe(res);