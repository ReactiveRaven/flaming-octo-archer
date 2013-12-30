require('./utils/duckpunch_httplog');
(function (couchdb, request, fs, easyimg) {
    
var download = function(uri, filename){
  return request(uri).pipe(fs.createWriteStream(filename));
};

//download('https://www.google.com/images/srpr/logo3w.png', 'google.png').on("close", function () {
//    easyimg.thumbnail({src: './google.png', dst: './google-thumb.png', width: 100}, function (err, info) {
//        console.log(info);
//    });
//});

function get_user_db_names(callback) {
    couchdb.db.list(function (err, result) {
        if (err) callback(err);
        
        callback(null, result.filter(function (db_name) { return db_name.match("^commissar_user"); }));
    });
}

get_user_db_names(function (err, db_names) {
    if (err) throw err;
    
    db_names.forEach(function (db_name) {
        var db = couchdb.use(db_name);
        db.view('validation_user_media', 'noThumbnails', function (err, result) {
            if (err) throw err;
            
            result.rows.forEach(function (doc) {
                doc = doc.value;
                console.log(doc);
            });
        });
    });
});
    
})(require('./utils/configured_nano'), require('request'), require('fs')/*, require('easyimage')/**/);