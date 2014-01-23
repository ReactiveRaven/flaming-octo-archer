(function (express, makeRequest, httpdefaults, request, thumbnailer_action) {

    var port = 3000;
    var app = express();

    app.use(express.cookieParser());

    function handleThumbnailPresets(preset) {
        "use strict";

        var presets = {
            'thumb-small': {
                'width': 200,
                'height': 200,
                'crop': true
            }
        };

        preset = presets[preset];

        return function (req, res) {
            thumbnailer_action(req, req.params.db + "/" + req.params.id, req.params.file, preset.width, preset.height, preset.crop, res);
        };
    }

    app.get("/thumbnail/thumb-small/:db/:id/:file", handleThumbnailPresets("thumb-small"));

    app.listen(port);
    console.log("listening on " + port);
})(
    require('express'),
    require("./utils/makeRequest")(require('./utils/configured_httpdefaults')),
    require('./utils/configured_httpdefaults'),
    require('request'),
    require('./thumbnailer-action')
);