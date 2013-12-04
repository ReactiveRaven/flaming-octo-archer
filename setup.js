var
  util = require('util'),
  fs = require('fs'),
  http = require('http'),
  extend = require("xtend"),
  couchdb = require('felix-couchdb'),
  conf = require("./conf/couchdb.json"),
  hostname = require('os').hostname();

if (typeof conf[hostname] === 'undefined') {
    hostname = 'default';
}
conf = conf[hostname];

var host = conf.url.split(":")[0],
    port = conf.url.split(":")[1],
    client = couchdb.createClient(port, host, conf.adminuser, conf.adminpass, 0);
    
var confdb = client.db("_config");

var httpdefaults = {
    host: host,
    port: port,
    auth: conf['adminuser'] + ':' + conf['adminpass']
};

function ensureSetting(path, value) {
    var _path = path;
    var _value = value;
    http.request(
        extend(
            httpdefaults,
            {
                path: _path
            }
        ),
        function (res) {
            var body = "";
            res.setEncoding("utf8");
            res.on("data", function (chunk) {
                body += ""+chunk;
            });
            res.on("end", function () {
                var postBody = "";
                if (JSON.parse(body) !== _value) {
                    var postReq = http.request(
                        extend(
                            httpdefaults,
                            {
                                path: _path,
                                method: "PUT"
                            }
                        ),
                        function (res) {
                            res.setEncoding("utf8");
                            res.on("data", function (chunk) {
                                postBody += "" + chunk;
                            });
                            res.on("end", function () {
                                console.log("Updated " + _path + " to " + _value + " from " + body);
                            });
                        }
                    );
                    postReq.write(JSON.stringify(_value));
                    postReq.end();
                }
            });
        }
    ).end();
}



ensureSetting('/_config/couchdb/delayed_commits', "false");
ensureSetting('/_config/couchdb/max_document_size', ""+(1024*1024*30));
ensureSetting('/_config/couch_httpd_auth/timeout', ""+(60*60*24*30));