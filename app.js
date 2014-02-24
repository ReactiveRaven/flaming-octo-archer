
(function (express, makeRequest, httpdefaults, request, thumbnailer_action) {

    /**
     * Module dependencies.
     */

    var routes = require('./routes');
    var user = require('./routes/user');
    var http = require('http');
    var path = require('path');
    var httpProxy = require('http-proxy');
    var proxy = new httpProxy.createProxyServer({target: 'http://localhost:5984'});

    var app = express();

    // all environments
    app.set('port', process.env.PORT || 3000);
    app.set('views', path.join(__dirname, 'views'));
    app.set('view engine', 'jade');
    app.use(express.cookieParser());
    app.use(function (req, res, next) {
        if (req.url.match(/^\/couchdb/)) {
            req.url = req.url.replace(/^\/couchdb/, "");

            console.log("Couch: " + req.url);

            proxy.web(req, res);
        } else {
            next();
        }
    });
    app.use(express.favicon());
    app.use(express.logger('dev'));
    app.use(express.json());
    app.use(express.urlencoded());
    app.use(express.methodOverride());
    app.use(app.router);
    app.use(require('less-middleware')({ src: path.join(__dirname, 'www') }));
    app.use(express.static(path.join(__dirname, 'www')));
    
    // development only
    if ('development' === app.get('env')) {
      app.use(express.errorHandler());
    }
    
//    function forwardToCouch(req, res, next) {
//        
//        req.url = req.url.replace(/^\/couchdb/, "");
//        
//        console.log(req.url);
//        
//        httpProxy.web(req, res);
//    }

//    app.get('/', routes.index);
//    app.get('/users', user.list);
//    app.all('/couchdb*', forwardToCouch);


    function handleThumbnailPresets(preset) {
        "use strict";

        var presets = {
            'thumb-small': {
                'width': 200,
                'height': 200,
                'crop': true
            },
            'display-resize': {
                'width': 500,
                'height': 500,
                'crop': false
            }
        };

        preset = presets[preset];

        return function (req, res) {
            thumbnailer_action(req, req.params.db + "/" + req.params.id, req.params.file, preset.width, preset.height, preset.crop, res);
        };
    }

    app.get("/thumbnail/thumb-small/:db/:id/:file", handleThumbnailPresets("thumb-small"));
    app.get("/thumbnail/display-resize/:db/:id/:file", handleThumbnailPresets("display-resize"));


    http.createServer(app).listen(app.get('port'), function(){
      console.log('Express server listening on port ' + app.get('port'));
    });

    
})(
    require('express'),
    require('./node/utils/makeRequest')(require('./node/utils/configured_httpdefaults')),
    require('./node/utils/configured_httpdefaults'),
    require('request'),
    require('./node/thumbnailer-action')
);