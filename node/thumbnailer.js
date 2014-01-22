(function (express, makeRequest, httpdefaults, request, thumbnailer_action) {

    var port = 3000;
    var app = express();

    app.use(express.cookieParser());

    app.get("/thumbnail/:width/:db/:id/:file", function (req, res) {

        thumbnailer_action(req, req.params.db + "/" + req.params.id, req.params.file, req.params.width, req.params.width, false, res);

//        request.get('http://' + httpdefaults.auth + '@' + httpdefaults.host + ':' + httpdefaults.port + '/' + req.params.db + "/" + req.params.id + "/" + req.params.file).pipe(res);



//        makeRequest({path: "/" + req.params.db + "/" + req.params.id + "/" + req.params.file}, null, function (err, body, req) {
//        //makeRequest({path: "/"}, null, function (err, body) {
//            if (err || body.error) { res.send(404, "Not found"); }
//            //var decoded = new Buffer(body, "base64").toString();
//            res.setHeader("Content-Type", req.headers['content-type']);
//            res.send(body);
//        });
    });

    app.listen(port);
    console.log("listening on " + port);
})(
    require('express'),
    require("./utils/makeRequest")(require('./utils/configured_httpdefaults')),
    require('./utils/configured_httpdefaults'),
    require('request'),
    require('./thumbnailer-action')
);