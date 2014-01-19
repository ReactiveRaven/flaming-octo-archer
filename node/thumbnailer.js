(function (express, makeRequest) {
    
    var port = 3000;
    
    var app = express();
    
    app.get("/thumbnail/:db/:id/:file", function (req, res) {
        makeRequest({path: "/" + req.params.db + "/" + req.params.id + "/" + req.params.file}, null, function (err, body, req) {
        //makeRequest({path: "/"}, null, function (err, body) {
            if (err || body.error) { res.send(404, "Not found"); }
            res.setHeader("Content-Type", req.headers['content-type']);
            res.setHeader("Content-Length", Buffer.byteLength(body));
            res.end(body);
        });
    });
    
    app.listen(port);
    console.log("listening on " + port);
})(require('express'), require("./utils/makeRequest")(require('./utils/configured_httpdefaults')));