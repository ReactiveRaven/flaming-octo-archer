define('constants', [], function () {
  return {
    templatePrefix: 'angular/templates/',
    allowedMediaTypes: ['image']
  };
});
(function (window, angular, undefined) {
  angular.module('ngCookies', ['ng']).factory('$cookies', [
    '$rootScope',
    '$browser',
    function ($rootScope, $browser) {
      var cookies = {}, lastCookies = {}, lastBrowserCookies, runEval = false, copy = angular.copy, isUndefined = angular.isUndefined;
      $browser.addPollFn(function () {
        var currentCookies = $browser.cookies();
        if (lastBrowserCookies != currentCookies) {
          lastBrowserCookies = currentCookies;
          copy(currentCookies, lastCookies);
          copy(currentCookies, cookies);
          if (runEval)
            $rootScope.$apply();
        }
      })();
      runEval = true;
      $rootScope.$watch(push);
      return cookies;
      function push() {
        var name, value, browserCookies, updated;
        for (name in lastCookies) {
          if (isUndefined(cookies[name])) {
            $browser.cookies(name, undefined);
          }
        }
        for (name in cookies) {
          value = cookies[name];
          if (!angular.isString(value)) {
            if (angular.isDefined(lastCookies[name])) {
              cookies[name] = lastCookies[name];
            } else {
              delete cookies[name];
            }
          } else if (value !== lastCookies[name]) {
            $browser.cookies(name, value);
            updated = true;
          }
        }
        if (updated) {
          updated = false;
          browserCookies = $browser.cookies();
          for (name in cookies) {
            if (cookies[name] !== browserCookies[name]) {
              if (isUndefined(browserCookies[name])) {
                delete cookies[name];
              } else {
                cookies[name] = browserCookies[name];
              }
              updated = true;
            }
          }
        }
      }
    }
  ]).factory('$cookieStore', [
    '$cookies',
    function ($cookies) {
      return {
        get: function (key) {
          var value = $cookies[key];
          return value ? angular.fromJson(value) : value;
        },
        put: function (key, value) {
          $cookies[key] = angular.toJson(value);
        },
        remove: function (key) {
          delete $cookies[key];
        }
      };
    }
  ]);
}(window, window.angular));
define('angularCookies', function () {
});
angular.module('CornerCouch', ['ng']).factory('cornercouch', [
  '$http',
  function ($http) {
    var ng = angular;
    function extendJSONP(config) {
      if (config.method === 'JSONP')
        if (config.params)
          config.params.callback = 'JSON_CALLBACK';
        else
          config.params = { callback: 'JSON_CALLBACK' };
      return config;
    }
    function encodeUri(base, part1, part2) {
      var uri = base;
      if (part1)
        uri = uri + '/' + encodeURIComponent(part1);
      if (part2)
        uri = uri + '/' + encodeURIComponent(part2);
      return uri.replace('%2F', '/');
    }
    function CouchDB(dbName, serverUri, getMethod) {
      var dbUri = encodeUri(serverUri, dbName);
      function CouchDoc(init) {
        ng.copy(init || {}, this);
      }
      CouchDoc.prototype.load = function (id, docParams) {
        var config = {
            method: getMethod,
            url: encodeUri(dbUri, id || this._id)
          };
        if (docParams)
          config.params = docParams;
        var doc = this;
        return $http(extendJSONP(config)).success(function (data) {
          ng.copy(data, doc);
        });
      };
      CouchDoc.prototype.save = function () {
        var config;
        if (this._id)
          config = {
            method: 'PUT',
            url: encodeUri(dbUri, this._id)
          };
        else
          config = {
            method: 'POST',
            url: dbUri
          };
        var doc = config.data = this;
        return $http(config).success(function (data) {
          if (data.id)
            doc._id = data.id;
          if (data.rev)
            doc._rev = data.rev;
        });
      };
      CouchDoc.prototype.remove = function () {
        return $http({
          method: 'DELETE',
          url: encodeUri(dbUri, this._id),
          params: { rev: this._rev }
        });
      };
      CouchDoc.prototype.attach = function (file, name) {
        var doc = this;
        return $http({
          method: 'PUT',
          url: encodeUri(dbUri, doc._id, name || file.name),
          params: { rev: doc._rev },
          headers: { 'Content-Type': file.type },
          data: file
        }).success(function () {
          doc.load();
        });
      };
      CouchDoc.prototype.detach = function (name) {
        var doc = this;
        return $http({
          method: 'DELETE',
          url: encodeUri(dbUri, doc._id, name),
          params: { rev: doc._rev }
        }).success(function () {
          doc.load();
        });
      };
      CouchDoc.prototype.attachUri = function (attachName) {
        return encodeUri(dbUri, this._id, attachName);
      };
      this.docClass = CouchDoc;
      this.uri = dbUri;
      this.method = getMethod;
      this.rows = [];
      this.prevRows = [];
      this.nextRow = null;
    }
    CouchDB.prototype.getInfo = function () {
      var db = this;
      return $http({
        method: 'GET',
        url: this.uri + '/'
      }).success(function (data) {
        db.info = data;
      });
    };
    CouchDB.prototype.newDoc = function (initData) {
      return new this.docClass(initData);
    };
    CouchDB.prototype.getDoc = function (id) {
      var doc = new this.docClass();
      doc.load(id);
      return doc;
    };
    CouchDB.prototype.getQueryDoc = function (idx) {
      var row = this.rows[idx];
      if (!row.doc)
        return this.getDoc(row.id);
      var doc = row.doc;
      if (doc instanceof this.docClass)
        return doc;
      doc = this.newDoc(doc);
      row.doc = doc;
      return doc;
    };
    function executeQuery(db) {
      return $http(db.qConfig).success(function (data, dt, hd, config) {
        if (config.params && config.params.limit) {
          if (data.rows.length == config.params.limit) {
            db.nextRow = data.rows.pop();
          } else {
            db.nextRow = null;
          }
        }
        db.rows = data.rows;
      });
    }
    CouchDB.prototype.queryView = function (viewURL, qparams) {
      var config = {
          method: this.method,
          url: this.uri + viewURL
        };
      if (qparams) {
        if (qparams.limit)
          qparams.limit++;
        for (p in qparams)
          switch (p) {
          case 'key':
          case 'keys':
          case 'startkey':
          case 'endkey':
            qparams[p] = ng.toJson(qparams[p]);
          }
        config.params = qparams;
      }
      this.qConfig = extendJSONP(config);
      return executeQuery(this);
    };
    CouchDB.prototype.query = function (design, view, qparams) {
      return this.queryView('/_design/' + encodeURIComponent(design) + '/_view/' + encodeURIComponent(view), qparams);
    };
    CouchDB.prototype.list = function (design, list, view, qparams) {
      return this.queryView('/_design/' + encodeURIComponent(design) + '/_list/' + encodeURIComponent(list) + '/' + encodeURIComponent(view), qparams);
    };
    CouchDB.prototype.queryAll = function (qparams) {
      return this.queryView('/_all_docs', qparams);
    };
    CouchDB.prototype.queryRefresh = function () {
      return executeQuery(this);
    };
    CouchDB.prototype.queryNext = function () {
      var row = this.nextRow;
      if (row) {
        this.prevRows.push(this.rows[0]);
        this.qConfig.params.startkey = ng.toJson(row.key);
        if (row.id && row.id !== row.key)
          this.qConfig.params.startkey_docid = row.id;
        return executeQuery(this);
      } else
        return null;
    };
    CouchDB.prototype.queryPrev = function () {
      var row = this.prevRows.pop();
      if (row) {
        this.qConfig.params.startkey = ng.toJson(row.key);
        if (row.id && row.id !== row.key)
          this.qConfig.params.startkey_docid = row.id;
        return executeQuery(this);
      } else
        return null;
    };
    function CouchServer(url, getMethod) {
      if (url) {
        this.uri = url;
        this.method = getMethod || 'JSONP';
      } else {
        this.uri = '';
        this.method = 'GET';
      }
    }
    CouchServer.prototype.getDB = function (dbName) {
      return new CouchDB(dbName, this.uri, this.method);
    };
    CouchServer.prototype.getUserDB = function () {
      if (!this.userDB)
        this.userDB = this.getDB('_users');
      return this.userDB;
    };
    CouchServer.prototype.getUserDoc = function () {
      var db = this.getUserDB();
      if (this.userCtx.name)
        this.userDoc = db.getDoc('org.couchdb.user:' + this.userCtx.name);
      else
        this.userDoc = db.newDoc();
      return this.userDoc;
    };
    CouchServer.prototype.getInfo = function () {
      var server = this;
      return $http({
        method: 'GET',
        url: this.uri + '/'
      }).success(function (data) {
        server.info = data;
      });
    };
    CouchServer.prototype.getDatabases = function () {
      var server = this;
      return $http({
        method: 'GET',
        url: this.uri + '/_all_dbs'
      }).success(function (data) {
        server.databases = data;
      });
    };
    CouchServer.prototype.createDB = function (dbName) {
      var server = this;
      return $http({
        method: 'PUT',
        url: encodeUri(server.uri, dbName)
      }).success(function () {
        if (server.databases)
          server.databases.push(dbName);
      });
    };
    CouchServer.prototype.session = function () {
      var server = this;
      return $http({
        method: 'GET',
        url: this.uri + '/_session'
      }).success(function (data) {
        server.userCtx = data.userCtx;
      });
    };
    CouchServer.prototype.login = function (usr, pwd) {
      var body = 'name=' + encodeURIComponent(usr) + '&password=' + encodeURIComponent(pwd);
      var server = this;
      var userName = usr;
      return $http({
        method: 'POST',
        url: this.uri + '/_session',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        data: body.replace(/%20/g, '+')
      }).success(function (data) {
        delete data['ok'];
        server.userCtx = data;
        server.userCtx.name = userName;
      });
    };
    CouchServer.prototype.logout = function () {
      var server = this;
      return $http({
        method: 'DELETE',
        url: this.uri + '/_session'
      }).success(function () {
        server.userCtx = {
          name: null,
          roles: []
        };
        server.userDoc = {};
      });
    };
    CouchServer.prototype.getUUIDs = function (cnt) {
      var server = this;
      return $http({
        method: 'GET',
        url: this.uri + '/_uuids',
        params: { count: cnt || 1 }
      }).success(function (data) {
        server.uuids = data.uuids;
      });
    };
    return function (url, method) {
      return new CouchServer(url, method);
    };
  }
]);
define('CornerCouch', function () {
});
define('services/Random', [], function () {
  var RandomModule = angular.module('commissar.services.Random', []);
  RandomModule.factory('Random', function () {
    var Random = {
        getHash: function () {
          return Date.now() + Math.random() + '';
        }
      };
    return Random;
  });
  return RandomModule;
});
define('services/Couch', [
  'CornerCouch',
  './Random'
], function () {
  var CouchModule = angular.module('commissar.services.Couch', [
      'CornerCouch',
      'ngCookies',
      'commissar.services.Random'
    ]);
  CouchModule.factory('Couch', [
    '$rootScope',
    'cornercouch',
    '$q',
    function ($rootScope, cornercouch, $q) {
      if (!$rootScope.cornercouch) {
        $rootScope.cornercouch = cornercouch('/couchdb', 'GET');
      }
      function isDefined(value) {
        return typeof value !== 'undefined';
      }
      var Couch = {
          _designDocs: {
            commissar_validation_global: {
              '_design/validation_global': {
                _id: '_design/validation_global',
                language: 'javascript',
                validate_doc_update: function (newDoc, oldDoc, userCtx) {
                  if (typeof newDoc['_deleted'] === 'undefined') {
                    if (typeof newDoc.type === 'undefined') {
                      throw { forbidden: 'All documents must have a type' };
                    }
                    if (userCtx.db !== 'commissar_user_' + userCtx.name && userCtx.roles.indexOf('+admin') === -1) {
                      throw { forbidden: 'Cannot alter documents outside your own database' };
                    }
                    if (typeof newDoc.created !== 'undefined') {
                      if (String(parseInt(newDoc.created, 10)) !== String(newDoc.created)) {
                        throw { forbidden: 'Created timestamp must be in unix format' };
                      }
                      if (oldDoc && typeof oldDoc.created !== 'undefined' && newDoc.created !== oldDoc.created) {
                        throw { forbidden: 'Cannot alter created timestamp once set' };
                      }
                    }
                    if (typeof newDoc.updated !== 'undefined' && String(parseInt(newDoc.updated, 10)) !== String(newDoc.updated)) {
                      throw { forbidden: 'Updated timestamp must be in unix format' };
                    }
                  }
                }
              }
            },
            commissar_validation_users: {
              '_design/validation_user': {
                _id: '_design/validation_user',
                language: 'javascript',
                validate_doc_update: function (newDoc, oldDoc, userCtx) {
                  if (typeof newDoc.author === 'undefined') {
                    throw { forbidden: 'Cannot create a document without an author field' };
                  }
                  if (newDoc.author !== userCtx.name && userCtx.roles.indexOf('+admin') === -1) {
                    throw { forbidden: 'Cannot forge authorship as another user' };
                  }
                  if (typeof newDoc._id === 'undefined') {
                    throw { forbidden: 'ID is missing' };
                  }
                  if (newDoc._id.indexOf(userCtx.name) !== 0) {
                    throw { forbidden: 'IDs must start with your username' };
                  }
                  if (!!oldDoc) {
                    if (typeof oldDoc.type !== 'undefined' && newDoc.type !== oldDoc.type) {
                      throw { forbidden: 'Cannot change the type of a document' };
                    }
                    if (typeof oldDoc.author !== 'undefined' && newDoc.author !== oldDoc.author) {
                      throw { forbidden: 'Cannot change the author of a document' };
                    }
                  }
                }
              },
              '_design/validation_user_media': {
                _id: '_design/validation_user_media',
                language: 'javascript',
                validate_doc_update: function (newDoc) {
                  if (newDoc.type === 'media') {
                    if (typeof newDoc.title === 'undefined') {
                      throw { forbidden: 'Media must have a title' };
                    }
                    if (typeof newDoc.created === 'undefined') {
                      throw { forbidden: 'Media must have a created timestamp' };
                    }
                    if (typeof newDoc.mediaType !== 'undefined' && newDoc.mediaType !== 'image') {
                      throw { forbidden: 'Invalid media type' };
                    }
                  }
                },
                views: {
                  all: {
                    map: function (document) {
                      if (typeof document.type === 'string' && document.type === 'media') {
                        emit(null, document);
                      }
                    }
                  },
                  byAuthor: {
                    map: function (document) {
                      if (typeof document.type === 'string' && document.type === 'media') {
                        emit(document.author, document);
                      }
                    }
                  }
                }
              }
            }
          },
          pushDesignDocs: function () {
            var deferred = $q.defer();
            Couch.getSession().then(function (session) {
              if (session.roles.indexOf('+admin') === -1) {
                deferred.reject('Cannot push design documents as you are not an admin');
                return false;
              }
              var remoteDocs = [];
              Object.getOwnPropertyNames(Couch._designDocs).forEach(function (databaseName) {
                var localDatabase = Couch._designDocs[databaseName];
                Object.getOwnPropertyNames(localDatabase).forEach(function (id) {
                  remoteDocs.push(Couch.applyStaticChanges(databaseName, localDatabase[id]));
                });
              });
              $q.all(remoteDocs).then(function (result) {
                deferred.resolve(result);
              }, function (reject) {
                deferred.reject(reject);
              });
            });
            return deferred.promise;
          },
          stringifyFunctions: function (obj) {
            for (var property in obj) {
              if (obj.hasOwnProperty(property)) {
                if (typeof obj[property] === 'function') {
                  obj[property] = '' + obj[property];
                } else if (typeof obj[property] === 'object') {
                  obj[property] = this.stringifyFunctions(obj[property]);
                }
              }
            }
            return obj;
          },
          applyStaticChanges: function (databaseName, documentObject) {
            var deferred = $q.defer();
            var updateRemote = function (document, remoteDocument) {
              Object.getOwnPropertyNames(document).forEach(function (property) {
                remoteDocument[property] = document[property];
              });
            };
            var deepCopy = true;
            var document = jQuery.extend(deepCopy, {}, documentObject);
            Couch.stringifyFunctions(document);
            Couch.getDoc(databaseName, document._id).then(function (remoteDocument) {
              updateRemote(document, remoteDocument);
              remoteDocument.save().then(function () {
                deferred.resolve(true);
              }, deferred.reject);
            }, function () {
              Couch.newDoc(databaseName).then(function (remoteDocument) {
                updateRemote(document, remoteDocument);
                remoteDocument.save().then(function () {
                  deferred.resolve(true);
                }, deferred.reject);
              }, deferred.reject);
            });
            return deferred.promise;
          },
          getDoc: function (database, id) {
            var deferred = $q.defer();
            Couch.databaseExists(database).then(function (databaseFound) {
              if (databaseFound) {
                var db = $rootScope.cornercouch.getDB(database);
                var doc = db.newDoc();
                var loading = doc.load(id);
                loading.success(function () {
                  deferred.resolve(doc);
                }).error(deferred.reject);
              } else {
                deferred.reject('Database not found: ' + database);
              }
            }, deferred.reject);
            return deferred.promise;
          },
          saveDoc: function (document, database) {
            var deferred = $q.defer();
            Couch.validateDoc(document, null, database).then(function () {
              Couch.databaseExists(database).then(function (exists) {
                if (exists) {
                  document.save().then(deferred.resolve, deferred.reject);
                } else {
                  deferred.reject('Database not found: ' + database);
                }
              });
            }, function (message) {
              console.error(message);
              deferred.reject(message);
            });
            return deferred.promise;
          },
          newDoc: function (database) {
            var deferred = $q.defer();
            Couch.databaseExists(database).then(function (databaseFound) {
              if (databaseFound) {
                var db = $rootScope.cornercouch.getDB(database);
                var doc = db.newDoc();
                deferred.resolve(doc);
              } else {
                deferred.reject('Database not found: ' + database);
              }
            }, deferred.reject);
            return deferred.promise;
          },
          validateDoc: function (newDoc, oldDoc, database) {
            var deferred = $q.defer(), viewDocs = Couch._designDocs;
            Couch.getSession().then(function (session) {
              var userCtx, docId, doc;
              userCtx = jQuery.extend({}, session);
              userCtx.db = database;
              try {
                if (database.indexOf('commissar_user') === 0) {
                  for (docId in viewDocs.commissar_validation_users) {
                    doc = viewDocs.commissar_validation_users[docId];
                    if (typeof doc.validate_doc_update === 'function') {
                      doc.validate_doc_update(newDoc, oldDoc, userCtx);
                    }
                  }
                }
                for (docId in viewDocs.commissar_validation_global) {
                  doc = viewDocs.commissar_validation_global[docId];
                  if (typeof doc.validate_doc_update === 'function') {
                    doc.validate_doc_update(newDoc, oldDoc, userCtx);
                  }
                }
              } catch (error) {
                if (typeof error.forbidden === 'undefined') {
                  throw error;
                }
                deferred.reject(error.forbidden);
              }
              deferred.resolve(true);
            }, function (reason) {
              deferred.reject(reason);
            });
            return deferred.promise;
          },
          databaseExists: function (databaseName) {
            var deferred = $q.defer();
            if (isDefined($rootScope.cornercouch.databases)) {
              deferred.resolve($rootScope.cornercouch.databases.indexOf(databaseName) > -1);
            } else {
              $rootScope.cornercouch.getDatabases().then(function () {
                deferred.resolve($rootScope.cornercouch.databases.indexOf(databaseName) > -1);
              });
            }
            return deferred.promise;
          },
          getSession: function () {
            var deferred = $q.defer();
            if (typeof $rootScope.cornercouch.userCtx !== 'undefined') {
              deferred.resolve($rootScope.cornercouch.userCtx);
            } else {
              $rootScope.cornercouch.session().then(function () {
                deferred.resolve($rootScope.cornercouch.userCtx);
              }, deferred.reject);
            }
            return deferred.promise;
          },
          login: function (username, password) {
            var deferred = $q.defer();
            $rootScope.cornercouch.login(username, password).then(function () {
              deferred.resolve(true);
            }, function () {
              deferred.resolve(false);
            });
            return deferred.promise;
          },
          logout: function () {
            return $rootScope.cornercouch.logout();
          },
          loggedIn: function () {
            var deferred = $q.defer();
            Couch.getSession().then(function (userCtx) {
              deferred.resolve(!!(userCtx && userCtx.name));
            }, deferred.reject);
            return deferred.promise;
          },
          hasRole: function (role) {
            var deferred = $q.defer();
            Couch.loggedIn().then(function (loggedIn) {
              if (loggedIn) {
                Couch.getSession().then(function (session) {
                  deferred.resolve(session.roles.indexOf(role) > -1);
                });
              } else {
                deferred.resolve(false);
              }
            }, deferred.reject);
            return deferred.promise;
          }
        };
      return Couch;
    }
  ]);
  return CouchModule;
});
define('services/PostSerializer', [], function () {
  var PostSerializerModule = angular.module('commissar.services.PostSerializer', []);
  PostSerializerModule.factory('PostSerializer', function () {
    var PostSerializer = {
        'serialize': function (input) {
          return $.param(input);
        }
      };
    return PostSerializer;
  });
  return PostSerializerModule;
});
define('services/Authentication', [
  'angularCookies',
  './Couch',
  './PostSerializer'
], function () {
  var AuthenticationModule = angular.module('commissar.services.Authentication', [
      'commissar.services.Couch',
      'commissar.services.PostSerializer'
    ]);
  AuthenticationModule.factory('Authentication', [
    'Couch',
    '$q',
    '$http',
    'PostSerializer',
    '$rootScope',
    function (Couch, $q, $http, PostSerializer, $rootScope) {
      var Authentication = {};
      Authentication.userExists = function (username) {
        if (typeof username === 'undefined') {
          var deferred = $q.defer();
          deferred.resolve(false);
          return deferred.promise;
        }
        return Couch.databaseExists(Authentication.getDatabaseName(username));
      };
      Authentication.loggedIn = function () {
        return Couch.loggedIn();
      };
      Authentication.hasRole = function (role) {
        return Couch.hasRole(role);
      };
      Authentication.isAdmin = function () {
        return Authentication.hasRole('+admin');
      };
      Authentication.getUsername = function () {
        var deferred = $q.defer();
        Authentication.loggedIn().then(function (loggedIn) {
          if (loggedIn) {
            Authentication.getSession().then(function (session) {
              deferred.resolve(session.name);
            }, deferred.reject);
          } else {
            deferred.reject('Not logged in');
          }
        }, deferred.reject);
        return deferred.promise;
      };
      Authentication.login = function (username, password) {
        var deferred = $q.defer();
        Couch.login(username, password).then(function (response) {
          deferred.resolve(response);
          $rootScope.$broadcast('AuthChange');
        }, function () {
          deferred.resolve(false);
        });
        return deferred.promise;
      };
      Authentication.register = function (username, password) {
        var deferred = $q.defer();
        $http.post('/server/register.php', PostSerializer.serialize({
          username: username,
          password: password
        }), { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }).success(function (data) {
          deferred.resolve(typeof data.ok !== 'undefined' ? true : data.error);
        }).error(function () {
          deferred.resolve(false);
        });
        return deferred.promise;
      };
      Authentication.getSession = function () {
        return Couch.getSession();
      };
      Authentication.getDatabaseName = function (username) {
        return 'commissar_user_' + username.toLowerCase();
      };
      Authentication.logout = function () {
        Couch.logout().then(function () {
          $rootScope.$broadcast('AuthChange');
        });
      };
      return Authentication;
    }
  ]);
  return AuthenticationModule;
});
;
(function () {
  var block = {
      newline: /^\n+/,
      code: /^( {4}[^\n]+\n*)+/,
      fences: noop,
      hr: /^( *[-*_]){3,} *(?:\n+|$)/,
      heading: /^ *(#{1,6}) *([^\n]+?) *#* *(?:\n+|$)/,
      nptable: noop,
      lheading: /^([^\n]+)\n *(=|-){2,} *(?:\n+|$)/,
      blockquote: /^( *>[^\n]+(\n[^\n]+)*\n*)+/,
      list: /^( *)(bull) [\s\S]+?(?:hr|\n{2,}(?! )(?!\1bull )\n*|\s*$)/,
      html: /^ *(?:comment|closed|closing) *(?:\n{2,}|\s*$)/,
      def: /^ *\[([^\]]+)\]: *<?([^\s>]+)>?(?: +["(]([^\n]+)[")])? *(?:\n+|$)/,
      table: noop,
      paragraph: /^((?:[^\n]+\n?(?!hr|heading|lheading|blockquote|tag|def))+)\n*/,
      text: /^[^\n]+/
    };
  block.bullet = /(?:[*+-]|\d+\.)/;
  block.item = /^( *)(bull) [^\n]*(?:\n(?!\1bull )[^\n]*)*/;
  block.item = replace(block.item, 'gm')(/bull/g, block.bullet)();
  block.list = replace(block.list)(/bull/g, block.bullet)('hr', /\n+(?=(?: *[-*_]){3,} *(?:\n+|$))/)();
  block._tag = '(?!(?:' + 'a|em|strong|small|s|cite|q|dfn|abbr|data|time|code' + '|var|samp|kbd|sub|sup|i|b|u|mark|ruby|rt|rp|bdi|bdo' + '|span|br|wbr|ins|del|img)\\b)\\w+(?!:/|@)\\b';
  block.html = replace(block.html)('comment', /<!--[\s\S]*?-->/)('closed', /<(tag)[\s\S]+?<\/\1>/)('closing', /<tag(?:"[^"]*"|'[^']*'|[^'">])*?>/)(/tag/g, block._tag)();
  block.paragraph = replace(block.paragraph)('hr', block.hr)('heading', block.heading)('lheading', block.lheading)('blockquote', block.blockquote)('tag', '<' + block._tag)('def', block.def)();
  block.normal = merge({}, block);
  block.gfm = merge({}, block.normal, {
    fences: /^ *(`{3,}|~{3,}) *(\S+)? *\n([\s\S]+?)\s*\1 *(?:\n+|$)/,
    paragraph: /^/
  });
  block.gfm.paragraph = replace(block.paragraph)('(?!', '(?!' + block.gfm.fences.source.replace('\\1', '\\2') + '|' + block.list.source.replace('\\1', '\\3') + '|')();
  block.tables = merge({}, block.gfm, {
    nptable: /^ *(\S.*\|.*)\n *([-:]+ *\|[-| :]*)\n((?:.*\|.*(?:\n|$))*)\n*/,
    table: /^ *\|(.+)\n *\|( *[-:]+[-| :]*)\n((?: *\|.*(?:\n|$))*)\n*/
  });
  function Lexer(options) {
    this.tokens = [];
    this.tokens.links = {};
    this.options = options || marked.defaults;
    this.rules = block.normal;
    if (this.options.gfm) {
      if (this.options.tables) {
        this.rules = block.tables;
      } else {
        this.rules = block.gfm;
      }
    }
  }
  Lexer.rules = block;
  Lexer.lex = function (src, options) {
    var lexer = new Lexer(options);
    return lexer.lex(src);
  };
  Lexer.prototype.lex = function (src) {
    src = src.replace(/\r\n|\r/g, '\n').replace(/\t/g, '    ').replace(/\u00a0/g, ' ').replace(/\u2424/g, '\n');
    return this.token(src, true);
  };
  Lexer.prototype.token = function (src, top) {
    var src = src.replace(/^ +$/gm, ''), next, loose, cap, bull, b, item, space, i, l;
    while (src) {
      if (cap = this.rules.newline.exec(src)) {
        src = src.substring(cap[0].length);
        if (cap[0].length > 1) {
          this.tokens.push({ type: 'space' });
        }
      }
      if (cap = this.rules.code.exec(src)) {
        src = src.substring(cap[0].length);
        cap = cap[0].replace(/^ {4}/gm, '');
        this.tokens.push({
          type: 'code',
          text: !this.options.pedantic ? cap.replace(/\n+$/, '') : cap
        });
        continue;
      }
      if (cap = this.rules.fences.exec(src)) {
        src = src.substring(cap[0].length);
        this.tokens.push({
          type: 'code',
          lang: cap[2],
          text: cap[3]
        });
        continue;
      }
      if (cap = this.rules.heading.exec(src)) {
        src = src.substring(cap[0].length);
        this.tokens.push({
          type: 'heading',
          depth: cap[1].length,
          text: cap[2]
        });
        continue;
      }
      if (top && (cap = this.rules.nptable.exec(src))) {
        src = src.substring(cap[0].length);
        item = {
          type: 'table',
          header: cap[1].replace(/^ *| *\| *$/g, '').split(/ *\| */),
          align: cap[2].replace(/^ *|\| *$/g, '').split(/ *\| */),
          cells: cap[3].replace(/\n$/, '').split('\n')
        };
        for (i = 0; i < item.align.length; i++) {
          if (/^ *-+: *$/.test(item.align[i])) {
            item.align[i] = 'right';
          } else if (/^ *:-+: *$/.test(item.align[i])) {
            item.align[i] = 'center';
          } else if (/^ *:-+ *$/.test(item.align[i])) {
            item.align[i] = 'left';
          } else {
            item.align[i] = null;
          }
        }
        for (i = 0; i < item.cells.length; i++) {
          item.cells[i] = item.cells[i].split(/ *\| */);
        }
        this.tokens.push(item);
        continue;
      }
      if (cap = this.rules.lheading.exec(src)) {
        src = src.substring(cap[0].length);
        this.tokens.push({
          type: 'heading',
          depth: cap[2] === '=' ? 1 : 2,
          text: cap[1]
        });
        continue;
      }
      if (cap = this.rules.hr.exec(src)) {
        src = src.substring(cap[0].length);
        this.tokens.push({ type: 'hr' });
        continue;
      }
      if (cap = this.rules.blockquote.exec(src)) {
        src = src.substring(cap[0].length);
        this.tokens.push({ type: 'blockquote_start' });
        cap = cap[0].replace(/^ *> ?/gm, '');
        this.token(cap, top);
        this.tokens.push({ type: 'blockquote_end' });
        continue;
      }
      if (cap = this.rules.list.exec(src)) {
        src = src.substring(cap[0].length);
        bull = cap[2];
        this.tokens.push({
          type: 'list_start',
          ordered: bull.length > 1
        });
        cap = cap[0].match(this.rules.item);
        next = false;
        l = cap.length;
        i = 0;
        for (; i < l; i++) {
          item = cap[i];
          space = item.length;
          item = item.replace(/^ *([*+-]|\d+\.) +/, '');
          if (~item.indexOf('\n ')) {
            space -= item.length;
            item = !this.options.pedantic ? item.replace(new RegExp('^ {1,' + space + '}', 'gm'), '') : item.replace(/^ {1,4}/gm, '');
          }
          if (this.options.smartLists && i !== l - 1) {
            b = block.bullet.exec(cap[i + 1])[0];
            if (bull !== b && !(bull.length > 1 && b.length > 1)) {
              src = cap.slice(i + 1).join('\n') + src;
              i = l - 1;
            }
          }
          loose = next || /\n\n(?!\s*$)/.test(item);
          if (i !== l - 1) {
            next = item.charAt(item.length - 1) === '\n';
            if (!loose)
              loose = next;
          }
          this.tokens.push({ type: loose ? 'loose_item_start' : 'list_item_start' });
          this.token(item, false);
          this.tokens.push({ type: 'list_item_end' });
        }
        this.tokens.push({ type: 'list_end' });
        continue;
      }
      if (cap = this.rules.html.exec(src)) {
        src = src.substring(cap[0].length);
        this.tokens.push({
          type: this.options.sanitize ? 'paragraph' : 'html',
          pre: cap[1] === 'pre' || cap[1] === 'script' || cap[1] === 'style',
          text: cap[0]
        });
        continue;
      }
      if (top && (cap = this.rules.def.exec(src))) {
        src = src.substring(cap[0].length);
        this.tokens.links[cap[1].toLowerCase()] = {
          href: cap[2],
          title: cap[3]
        };
        continue;
      }
      if (top && (cap = this.rules.table.exec(src))) {
        src = src.substring(cap[0].length);
        item = {
          type: 'table',
          header: cap[1].replace(/^ *| *\| *$/g, '').split(/ *\| */),
          align: cap[2].replace(/^ *|\| *$/g, '').split(/ *\| */),
          cells: cap[3].replace(/(?: *\| *)?\n$/, '').split('\n')
        };
        for (i = 0; i < item.align.length; i++) {
          if (/^ *-+: *$/.test(item.align[i])) {
            item.align[i] = 'right';
          } else if (/^ *:-+: *$/.test(item.align[i])) {
            item.align[i] = 'center';
          } else if (/^ *:-+ *$/.test(item.align[i])) {
            item.align[i] = 'left';
          } else {
            item.align[i] = null;
          }
        }
        for (i = 0; i < item.cells.length; i++) {
          item.cells[i] = item.cells[i].replace(/^ *\| *| *\| *$/g, '').split(/ *\| */);
        }
        this.tokens.push(item);
        continue;
      }
      if (top && (cap = this.rules.paragraph.exec(src))) {
        src = src.substring(cap[0].length);
        this.tokens.push({
          type: 'paragraph',
          text: cap[1].charAt(cap[1].length - 1) === '\n' ? cap[1].slice(0, -1) : cap[1]
        });
        continue;
      }
      if (cap = this.rules.text.exec(src)) {
        src = src.substring(cap[0].length);
        this.tokens.push({
          type: 'text',
          text: cap[0]
        });
        continue;
      }
      if (src) {
        throw new Error('Infinite loop on byte: ' + src.charCodeAt(0));
      }
    }
    return this.tokens;
  };
  var inline = {
      escape: /^\\([\\`*{}\[\]()#+\-.!_>])/,
      autolink: /^<([^ >]+(@|:\/)[^ >]+)>/,
      url: noop,
      tag: /^<!--[\s\S]*?-->|^<\/?\w+(?:"[^"]*"|'[^']*'|[^'">])*?>/,
      link: /^!?\[(inside)\]\(href\)/,
      reflink: /^!?\[(inside)\]\s*\[([^\]]*)\]/,
      nolink: /^!?\[((?:\[[^\]]*\]|[^\[\]])*)\]/,
      strong: /^__([\s\S]+?)__(?!_)|^\*\*([\s\S]+?)\*\*(?!\*)/,
      em: /^\b_((?:__|[\s\S])+?)_\b|^\*((?:\*\*|[\s\S])+?)\*(?!\*)/,
      code: /^(`+)\s*([\s\S]*?[^`])\s*\1(?!`)/,
      br: /^ {2,}\n(?!\s*$)/,
      del: noop,
      text: /^[\s\S]+?(?=[\\<!\[_*`]| {2,}\n|$)/
    };
  inline._inside = /(?:\[[^\]]*\]|[^\[\]]|\](?=[^\[]*\]))*/;
  inline._href = /\s*<?([\s\S]*?)>?(?:\s+['"]([\s\S]*?)['"])?\s*/;
  inline.link = replace(inline.link)('inside', inline._inside)('href', inline._href)();
  inline.reflink = replace(inline.reflink)('inside', inline._inside)();
  inline.normal = merge({}, inline);
  inline.pedantic = merge({}, inline.normal, {
    strong: /^__(?=\S)([\s\S]*?\S)__(?!_)|^\*\*(?=\S)([\s\S]*?\S)\*\*(?!\*)/,
    em: /^_(?=\S)([\s\S]*?\S)_(?!_)|^\*(?=\S)([\s\S]*?\S)\*(?!\*)/
  });
  inline.gfm = merge({}, inline.normal, {
    escape: replace(inline.escape)('])', '~|])')(),
    url: /^(https?:\/\/[^\s<]+[^<.,:;"')\]\s])/,
    del: /^~~(?=\S)([\s\S]*?\S)~~/,
    text: replace(inline.text)(']|', '~]|')('|', '|https?://|')()
  });
  inline.breaks = merge({}, inline.gfm, {
    br: replace(inline.br)('{2,}', '*')(),
    text: replace(inline.gfm.text)('{2,}', '*')()
  });
  function InlineLexer(links, options) {
    this.options = options || marked.defaults;
    this.links = links;
    this.rules = inline.normal;
    if (!this.links) {
      throw new Error('Tokens array requires a `links` property.');
    }
    if (this.options.gfm) {
      if (this.options.breaks) {
        this.rules = inline.breaks;
      } else {
        this.rules = inline.gfm;
      }
    } else if (this.options.pedantic) {
      this.rules = inline.pedantic;
    }
  }
  InlineLexer.rules = inline;
  InlineLexer.output = function (src, links, options) {
    var inline = new InlineLexer(links, options);
    return inline.output(src);
  };
  InlineLexer.prototype.output = function (src) {
    var out = '', link, text, href, cap;
    while (src) {
      if (cap = this.rules.escape.exec(src)) {
        src = src.substring(cap[0].length);
        out += cap[1];
        continue;
      }
      if (cap = this.rules.autolink.exec(src)) {
        src = src.substring(cap[0].length);
        if (cap[2] === '@') {
          text = cap[1].charAt(6) === ':' ? this.mangle(cap[1].substring(7)) : this.mangle(cap[1]);
          href = this.mangle('mailto:') + text;
        } else {
          text = escape(cap[1]);
          href = text;
        }
        out += '<a href="' + href + '">' + text + '</a>';
        continue;
      }
      if (cap = this.rules.url.exec(src)) {
        src = src.substring(cap[0].length);
        text = escape(cap[1]);
        href = text;
        out += '<a href="' + href + '">' + text + '</a>';
        continue;
      }
      if (cap = this.rules.tag.exec(src)) {
        src = src.substring(cap[0].length);
        out += this.options.sanitize ? escape(cap[0]) : cap[0];
        continue;
      }
      if (cap = this.rules.link.exec(src)) {
        src = src.substring(cap[0].length);
        out += this.outputLink(cap, {
          href: cap[2],
          title: cap[3]
        });
        continue;
      }
      if ((cap = this.rules.reflink.exec(src)) || (cap = this.rules.nolink.exec(src))) {
        src = src.substring(cap[0].length);
        link = (cap[2] || cap[1]).replace(/\s+/g, ' ');
        link = this.links[link.toLowerCase()];
        if (!link || !link.href) {
          out += cap[0].charAt(0);
          src = cap[0].substring(1) + src;
          continue;
        }
        out += this.outputLink(cap, link);
        continue;
      }
      if (cap = this.rules.strong.exec(src)) {
        src = src.substring(cap[0].length);
        out += '<strong>' + this.output(cap[2] || cap[1]) + '</strong>';
        continue;
      }
      if (cap = this.rules.em.exec(src)) {
        src = src.substring(cap[0].length);
        out += '<em>' + this.output(cap[2] || cap[1]) + '</em>';
        continue;
      }
      if (cap = this.rules.code.exec(src)) {
        src = src.substring(cap[0].length);
        out += '<code>' + escape(cap[2], true) + '</code>';
        continue;
      }
      if (cap = this.rules.br.exec(src)) {
        src = src.substring(cap[0].length);
        out += '<br>';
        continue;
      }
      if (cap = this.rules.del.exec(src)) {
        src = src.substring(cap[0].length);
        out += '<del>' + this.output(cap[1]) + '</del>';
        continue;
      }
      if (cap = this.rules.text.exec(src)) {
        src = src.substring(cap[0].length);
        out += escape(this.smartypants(cap[0]));
        continue;
      }
      if (src) {
        throw new Error('Infinite loop on byte: ' + src.charCodeAt(0));
      }
    }
    return out;
  };
  InlineLexer.prototype.outputLink = function (cap, link) {
    if (cap[0].charAt(0) !== '!') {
      return '<a href="' + escape(link.href) + '"' + (link.title ? ' title="' + escape(link.title) + '"' : '') + '>' + this.output(cap[1]) + '</a>';
    } else {
      return '<img src="' + escape(link.href) + '" alt="' + escape(cap[1]) + '"' + (link.title ? ' title="' + escape(link.title) + '"' : '') + '>';
    }
  };
  InlineLexer.prototype.smartypants = function (text) {
    if (!this.options.smartypants)
      return text;
    return text.replace(/--/g, '\u2014').replace(/(^|[-\u2014/(\[{"\s])'/g, '$1\u2018').replace(/'/g, '\u2019').replace(/(^|[-\u2014/(\[{\u2018\s])"/g, '$1\u201c').replace(/"/g, '\u201d').replace(/\.{3}/g, '\u2026');
  };
  InlineLexer.prototype.mangle = function (text) {
    var out = '', l = text.length, i = 0, ch;
    for (; i < l; i++) {
      ch = text.charCodeAt(i);
      if (Math.random() > 0.5) {
        ch = 'x' + ch.toString(16);
      }
      out += '&#' + ch + ';';
    }
    return out;
  };
  function Parser(options) {
    this.tokens = [];
    this.token = null;
    this.options = options || marked.defaults;
  }
  Parser.parse = function (src, options) {
    var parser = new Parser(options);
    return parser.parse(src);
  };
  Parser.prototype.parse = function (src) {
    this.inline = new InlineLexer(src.links, this.options);
    this.tokens = src.reverse();
    var out = '';
    while (this.next()) {
      out += this.tok();
    }
    return out;
  };
  Parser.prototype.next = function () {
    return this.token = this.tokens.pop();
  };
  Parser.prototype.peek = function () {
    return this.tokens[this.tokens.length - 1] || 0;
  };
  Parser.prototype.parseText = function () {
    var body = this.token.text;
    while (this.peek().type === 'text') {
      body += '\n' + this.next().text;
    }
    return this.inline.output(body);
  };
  Parser.prototype.tok = function () {
    switch (this.token.type) {
    case 'space': {
        return '';
      }
    case 'hr': {
        return '<hr>\n';
      }
    case 'heading': {
        return '<h' + this.token.depth + ' id="' + this.token.text.toLowerCase().replace(/[^\w]+/g, '-') + '">' + this.inline.output(this.token.text) + '</h' + this.token.depth + '>\n';
      }
    case 'code': {
        if (this.options.highlight) {
          var code = this.options.highlight(this.token.text, this.token.lang);
          if (code != null && code !== this.token.text) {
            this.token.escaped = true;
            this.token.text = code;
          }
        }
        if (!this.token.escaped) {
          this.token.text = escape(this.token.text, true);
        }
        return '<pre><code' + (this.token.lang ? ' class="' + this.options.langPrefix + this.token.lang + '"' : '') + '>' + this.token.text + '</code></pre>\n';
      }
    case 'table': {
        var body = '', heading, i, row, cell, j;
        body += '<thead>\n<tr>\n';
        for (i = 0; i < this.token.header.length; i++) {
          heading = this.inline.output(this.token.header[i]);
          body += '<th';
          if (this.token.align[i]) {
            body += ' style="text-align:' + this.token.align[i] + '"';
          }
          body += '>' + heading + '</th>\n';
        }
        body += '</tr>\n</thead>\n';
        body += '<tbody>\n';
        for (i = 0; i < this.token.cells.length; i++) {
          row = this.token.cells[i];
          body += '<tr>\n';
          for (j = 0; j < row.length; j++) {
            cell = this.inline.output(row[j]);
            body += '<td';
            if (this.token.align[j]) {
              body += ' style="text-align:' + this.token.align[j] + '"';
            }
            body += '>' + cell + '</td>\n';
          }
          body += '</tr>\n';
        }
        body += '</tbody>\n';
        return '<table>\n' + body + '</table>\n';
      }
    case 'blockquote_start': {
        var body = '';
        while (this.next().type !== 'blockquote_end') {
          body += this.tok();
        }
        return '<blockquote>\n' + body + '</blockquote>\n';
      }
    case 'list_start': {
        var type = this.token.ordered ? 'ol' : 'ul', body = '';
        while (this.next().type !== 'list_end') {
          body += this.tok();
        }
        return '<' + type + '>\n' + body + '</' + type + '>\n';
      }
    case 'list_item_start': {
        var body = '';
        while (this.next().type !== 'list_item_end') {
          body += this.token.type === 'text' ? this.parseText() : this.tok();
        }
        return '<li>' + body + '</li>\n';
      }
    case 'loose_item_start': {
        var body = '';
        while (this.next().type !== 'list_item_end') {
          body += this.tok();
        }
        return '<li>' + body + '</li>\n';
      }
    case 'html': {
        return !this.token.pre && !this.options.pedantic ? this.inline.output(this.token.text) : this.token.text;
      }
    case 'paragraph': {
        return '<p>' + this.inline.output(this.token.text) + '</p>\n';
      }
    case 'text': {
        return '<p>' + this.parseText() + '</p>\n';
      }
    }
  };
  function escape(html, encode) {
    return html.replace(!encode ? /&(?!#?\w+;)/g : /&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
  function replace(regex, opt) {
    regex = regex.source;
    opt = opt || '';
    return function self(name, val) {
      if (!name)
        return new RegExp(regex, opt);
      val = val.source || val;
      val = val.replace(/(^|[^\[])\^/g, '$1');
      regex = regex.replace(name, val);
      return self;
    };
  }
  function noop() {
  }
  noop.exec = noop;
  function merge(obj) {
    var i = 1, target, key;
    for (; i < arguments.length; i++) {
      target = arguments[i];
      for (key in target) {
        if (Object.prototype.hasOwnProperty.call(target, key)) {
          obj[key] = target[key];
        }
      }
    }
    return obj;
  }
  function marked(src, opt, callback) {
    if (callback || typeof opt === 'function') {
      if (!callback) {
        callback = opt;
        opt = null;
      }
      opt = merge({}, marked.defaults, opt || {});
      var highlight = opt.highlight, tokens, pending, i = 0;
      try {
        tokens = Lexer.lex(src, opt);
      } catch (e) {
        return callback(e);
      }
      pending = tokens.length;
      var done = function () {
        var out, err;
        try {
          out = Parser.parse(tokens, opt);
        } catch (e) {
          err = e;
        }
        opt.highlight = highlight;
        return err ? callback(err) : callback(null, out);
      };
      if (!highlight || highlight.length < 3) {
        return done();
      }
      delete opt.highlight;
      if (!pending)
        return done();
      for (; i < tokens.length; i++) {
        (function (token) {
          if (token.type !== 'code') {
            return --pending || done();
          }
          return highlight(token.text, token.lang, function (err, code) {
            if (code == null || code === token.text) {
              return --pending || done();
            }
            token.text = code;
            token.escaped = true;
            --pending || done();
          });
        }(tokens[i]));
      }
      return;
    }
    try {
      if (opt)
        opt = merge({}, marked.defaults, opt);
      return Parser.parse(Lexer.lex(src, opt), opt);
    } catch (e) {
      e.message += '\nPlease report this to https://github.com/chjj/marked.';
      if ((opt || marked.defaults).silent) {
        return '<p>An error occured:</p><pre>' + escape(e.message + '', true) + '</pre>';
      }
      throw e;
    }
  }
  marked.options = marked.setOptions = function (opt) {
    merge(marked.defaults, opt);
    return marked;
  };
  marked.defaults = {
    gfm: true,
    tables: true,
    breaks: false,
    pedantic: false,
    sanitize: false,
    smartLists: false,
    silent: false,
    highlight: null,
    langPrefix: 'lang-',
    smartypants: false
  };
  marked.Parser = Parser;
  marked.parser = Parser.parse;
  marked.Lexer = Lexer;
  marked.lexer = Lexer.lex;
  marked.InlineLexer = InlineLexer;
  marked.inlineLexer = InlineLexer.output;
  marked.parse = marked;
  if (typeof exports === 'object') {
    module.exports = marked;
  } else if (typeof define === 'function' && define.amd) {
    define('marked', [], function () {
      return marked;
    });
  } else {
    this.marked = marked;
  }
}.call(function () {
  return this || (typeof window !== 'undefined' ? window : global);
}()));
define('directives/Markdown', ['marked'], function (marked) {
  var MarkdownModule = angular.module('commissar.directives.Markdown', []);
  MarkdownModule.directive('markdown', function () {
    var link = function (scope, element, attrs, model) {
      var render = function () {
        try {
          var htmlText = marked(model.$modelValue);
          element.html(htmlText);
          if (typeof attrs.firstparagraph !== 'undefined') {
            var wrap = document.createElement('div');
            wrap.appendChild(element.find('p')[0].cloneNode(true));
            element.html(wrap.innerHTML);
          }
          if (typeof attrs.textonly !== 'undefined') {
            element.html(element.text());
          }
          if (typeof attrs.wordlimit !== 'undefined') {
            var wordlimit = parseInt(attrs.wordlimit, 10);
            var words = element.text().split(' ');
            if (words.length > wordlimit) {
              var newWords = [];
              for (var i = 0; i < wordlimit; i++) {
                newWords.push(words[i]);
              }
              newWords.push('...');
              words = newWords;
            }
            element.html(words.join(' '));
          }
        } catch (e) {
        }
      };
      scope.$watch(attrs['ngModel'], render);
      render();
    };
    return {
      restrict: 'A',
      require: 'ngModel',
      link: link
    };
  });
  return MarkdownModule;
});
define('filters/Capitalize', [], function () {
  var CapitalizeModule = angular.module('commissar.filters.Capitalize', []);
  CapitalizeModule.filter('Capitalize', function () {
    return function (input) {
      if (input) {
        return input.substring(0, 1).toUpperCase() + input.substring(1);
      }
      return null;
    };
  });
});
define('controllers/LogoutCtrl', [
  'constants',
  '../services/Authentication',
  '../directives/Markdown',
  '../filters/Capitalize'
], function (constants) {
  var LogoutCtrlModule = angular.module('commissar.controllers.LogoutCtrl', ['commissar.services.Authentication']);
  LogoutCtrlModule.controller('LogoutCtrl', [
    '$scope',
    'Authentication',
    function ($scope, Authentication) {
      $scope.name = 'LogoutCtrl';
      Authentication.logout();
    }
  ]);
  LogoutCtrlModule.config([
    '$routeProvider',
    function ($routeProvider) {
      $routeProvider.when('/logout', {
        templateUrl: constants.templatePrefix + 'logout.html',
        controller: 'LogoutCtrl'
      });
    }
  ]);
  return LogoutCtrlModule;
});
define('controllers/AdminCtrl', ['constants'], function (constants) {
  var AdminCtrlModule = angular.module('commissar.controllers.AdminCtrl', [
      'commissar.services.Authentication',
      'commissar.directives.Markdown',
      'commissar.filters.Capitalize'
    ]);
  AdminCtrlModule.controller('AdminCtrl', [
    '$scope',
    'Couch',
    function ($scope, Couch) {
      $scope.name = 'AdminCtrl';
      $scope.pushDesignDocs = function () {
        $scope.pushingDesignDocs = true;
        $scope.pushDesignDocsErrors = false;
        Couch.pushDesignDocs().then(function () {
          $scope.pushingDesignDocs = false;
        }, function (error) {
          $scope.pushingDesignDocs = false;
          $scope.pushDesignDocsErrors = error;
        });
      };
      $scope.pushingDesignDocs = false;
      $scope.pushDesignDocsErrors = false;
    }
  ]);
  AdminCtrlModule.config([
    '$routeProvider',
    function ($routeProvider) {
      $routeProvider.when('/admin', {
        templateUrl: constants.templatePrefix + 'admin.html',
        controller: 'AdminCtrl'
      });
    }
  ]);
  return AdminCtrlModule;
});
define('controllers/IndexCtrl', [
  'constants',
  '../services/Authentication',
  '../directives/Markdown',
  '../filters/Capitalize'
], function (constants) {
  var IndexCtrlModule = angular.module('commissar.controllers.IndexCtrl', [
      'commissar.services.Authentication',
      'commissar.directives.Markdown',
      'commissar.filters.Capitalize'
    ]);
  IndexCtrlModule.controller('IndexCtrl', [
    '$scope',
    function ($scope) {
      $scope.name = 'IndexCtrl';
    }
  ]);
  IndexCtrlModule.config([
    '$routeProvider',
    function ($routeProvider) {
      $routeProvider.when('/', {
        templateUrl: constants.templatePrefix + 'index.html',
        controller: 'IndexCtrl'
      });
      $routeProvider.otherwise({ redirectTo: '/' });
    }
  ]);
  return IndexCtrlModule;
});
define('controllers/WelcomeCtrl', [
  'constants',
  'services/Authentication',
  'directives/Markdown',
  'filters/Capitalize'
], function (constants) {
  var WelcomeCtrlModule = angular.module('commissar.controllers.WelcomeCtrl', [
      'commissar.services.Authentication',
      'commissar.directives.Markdown',
      'commissar.filters.Capitalize'
    ]);
  WelcomeCtrlModule.controller('WelcomeCtrl', [
    '$scope',
    function ($scope) {
      $scope.name = 'WelcomeCtrl';
    }
  ]);
  WelcomeCtrlModule.config([
    '$routeProvider',
    function ($routeProvider) {
      $routeProvider.when('/welcome', {
        templateUrl: constants.templatePrefix + 'welcome.html',
        controller: 'WelcomeCtrl'
      });
    }
  ]);
  return WelcomeCtrlModule;
});
define('services/ParanoidScope', [], function () {
  var ParanoidScopeModule = angular.module('commissar.services.ParanoidScope', []);
  ParanoidScopeModule.factory('ParanoidScope', function () {
    var ParanoidScope = {
        apply: function (localScope, func) {
          if (typeof func === 'undefined') {
            func = function () {
            };
          }
          if (!localScope.$$phase && !localScope.$root.$$phase) {
            localScope.$apply(func);
          } else {
            func();
          }
        },
        digest: function (localScope, func) {
          if (typeof func === 'undefined') {
            func = function () {
            };
          }
          if (!localScope.$$phase && !localScope.$root.$$phase) {
            localScope.$digest(func);
          } else {
            func();
          }
        }
      };
    return ParanoidScope;
  });
  return ParanoidScopeModule;
});
define('directives/LoginForm', [
  'constants',
  'services/Authentication',
  'services/ParanoidScope'
], function (constants) {
  var LoginFormModule = angular.module('commissar.directives.LoginForm', [
      'commissar.services.Authentication',
      'commissar.services.ParanoidScope'
    ]);
  LoginFormModule.controller('commissar.directives.LoginForm.controller', [
    '$scope',
    'Authentication',
    '$location',
    'ParanoidScope',
    '$timeout',
    function ($scope, Authentication, $location, ParanoidScope, $timeout) {
      $scope.name = 'commissar.directives.LoginForm.controller';
      $scope.loggedIn = null;
      $scope.accessDenied = false;
      $scope.loginAttemptedRecently = false;
      Authentication.loggedIn().then(function (response) {
        $scope.loggedIn = response;
      });
      $scope.login = function (username, password) {
        if (typeof username === 'undefined') {
          username = $scope.loginFormUsername;
        }
        if (typeof password === 'undefined') {
          password = $scope.loginFormPassword;
        }
        return Authentication.login(username, password).then(function (reply) {
          $scope.loggedIn = !!reply;
          $scope.accessDenied = !reply;
          $scope.loginAttemptedRecently = true;
          $timeout(function () {
            $scope.loginAttemptedRecently = false;
          }, 1000);
          if (reply) {
            $scope.loginFormUsername = '';
            $scope.loginFormPassword = '';
          }
          return reply;
        });
      };
      $scope.userExists = function (username) {
        if (typeof username === 'undefined') {
          username = $scope.loginFormUsername;
        }
        return Authentication.userExists(username).then(function (reply) {
          return reply;
        });
      };
      $scope.register = function (username, password) {
        if (typeof username === 'undefined') {
          username = $scope.loginFormUsername;
        }
        if (typeof password === 'undefined') {
          password = $scope.loginFormPassword;
        }
        var deferred = Authentication.register(username, password);
        deferred.then(function (reply) {
          if (reply === true) {
            Authentication.login(username, password).then(function () {
              $location.path('/welcome');
            });
          }
        });
        return deferred;
      };
      (function () {
        var lastUsername = null, lastResponse = null;
        $scope.isUsernameRecognised = function (username) {
          var response = null;
          if (typeof username === 'undefined') {
            username = $scope.loginFormUsername;
          }
          if (username === lastUsername) {
            response = lastResponse;
          } else {
            lastUsername = username;
            lastResponse = false;
            Authentication.userExists(username).then(function (reply) {
              ParanoidScope.apply($scope, function () {
                lastResponse = reply;
              });
            });
            response = false;
          }
          return response;
        };
        $scope.$watch('loginFormUsername', function () {
          $scope.isUsernameRecognised();
        });
      }());
    }
  ]);
  LoginFormModule.directive('loginForm', function () {
    var LoginForm = {
        priority: 0,
        templateUrl: constants.templatePrefix + 'directives/LoginForm.html',
        replace: true,
        transclude: true,
        restrict: 'AE',
        scope: {},
        controller: 'commissar.directives.LoginForm.controller'
      };
    return LoginForm;
  });
  return LoginFormModule;
});
define('controllers/MenuCtrl', [
  'services/Authentication',
  'filters/Capitalize',
  'directives/LoginForm',
  'services/ParanoidScope'
], function () {
  var MenuCtrlModule = angular.module('commissar.controllers.MenuCtrl', [
      'commissar.services.Authentication',
      'commissar.directives.Markdown',
      'commissar.filters.Capitalize',
      'commissar.directives.LoginForm',
      'commissar.services.ParanoidScope'
    ]);
  MenuCtrlModule.controller('MenuCtrl', [
    '$scope',
    'Authentication',
    'ParanoidScope',
    '$q',
    function ($scope, Authentication, ParanoidScope, $q) {
      $scope.name = 'MenuCtrl';
      $scope.loggedIn = false;
      $scope.isAdmin = false;
      $scope.onAuthChange = function () {
        $q.all([
          Authentication.loggedIn(),
          Authentication.getSession(),
          Authentication.isAdmin()
        ]).then(function (returnValues) {
          $scope.loggedIn = returnValues[0];
          $scope.userCtx = returnValues[1];
          $scope.isAdmin = returnValues[2];
          ParanoidScope.apply($scope);
          ParanoidScope.digest($scope);
        });
      };
      $scope.onAuthChange();
      $scope.$on('AuthChange', $scope.onAuthChange);
      $scope.logout = function () {
        Authentication.logout();
      };
    }
  ]);
  return MenuCtrlModule;
});
define('directives/UploadForm', [
  'constants',
  'services/Authentication',
  'services/ParanoidScope',
  'services/Couch',
  'services/Random'
], function (constants) {
  var UploadFormModule = angular.module('commissar.directives.UploadForm', [
      'commissar.services.Authentication',
      'commissar.services.ParanoidScope',
      'commissar.services.Couch',
      'commissar.services.Random'
    ]);
  UploadFormModule.controller('commissar.directives.UploadForm.controller', [
    '$scope',
    '$q',
    'Couch',
    'Authentication',
    'Random',
    function ($scope, $q, Couch, Authentication, Random) {
      $scope.name = 'commissar.directives.UploadForm.controller';
      $scope.valid = function () {
        return !!$scope.uploadFormName && !!$scope.uploadFormFile;
      };
      $scope.fileChanged = function (angularEvent, input) {
        $scope.$apply(function () {
          $scope.uploadFormFile = input[0].files;
        });
      };
      $scope.$on('filechanged', function () {
        $scope.fileChanged.apply($scope, arguments);
      });
      $scope.upload = function () {
        var deferred = $q.defer();
        if ($scope.valid()) {
          Authentication.getUsername().then(function (username) {
            var databaseName = Authentication.getDatabaseName(username);
            Couch.newDoc(databaseName).then(function (document) {
              document._id = username + '_media_' + Random.getHash();
              document.author = username;
              document.type = 'media';
              document.mediaType = 'image';
              document.title = $scope.uploadFormName;
              document.created = Math.floor(Date.now() / 1000);
              Couch.saveDoc(document, databaseName).then(function () {
                document.attach($scope.uploadFormFile[0]).then(function () {
                  deferred.resolve(true);
                }, deferred.reject);
              }, deferred.reject);
            });
          }, deferred.reject);
        } else {
          deferred.reject('Not valid');
        }
        return deferred.promise;
      };
    }
  ]);
  UploadFormModule.directive('uploadForm', function () {
    var UploadForm = {
        priority: 0,
        templateUrl: constants.templatePrefix + 'directives/UploadForm.html',
        replace: true,
        transclude: true,
        restrict: 'AE',
        scope: {},
        controller: 'commissar.directives.UploadForm.controller',
        link: function ($scope, $element) {
          var $fileinput = jQuery($element).find('input[type=file]');
          $fileinput.on('change', function (event) {
            $scope.$broadcast('filechanged', $fileinput, event);
          });
        }
      };
    return UploadForm;
  });
  return UploadFormModule;
});
define('directives/Media', [
  'constants',
  'services/Authentication',
  'services/ParanoidScope'
], function (constants) {
  var MediaModule = angular.module('commissar.directives.Media', [
      'commissar.services.Authentication',
      'commissar.services.ParanoidScope'
    ]);
  MediaModule.controller('commissar.directives.Media.controller', [
    '$scope',
    function ($scope) {
      $scope.name = 'commissar.directives.Media.controller';
      $scope.className = function () {
        var mediaType = $scope.document.mediaType;
        if (constants.allowedMediaTypes.indexOf(mediaType) < 0) {
          mediaType = '';
        }
        return 'media ' + mediaType;
      };
    }
  ]);
  MediaModule.directive('media', function () {
    var Media = {
        priority: 0,
        templateUrl: constants.templatePrefix + 'directives/Media.html',
        replace: true,
        transclude: true,
        restrict: 'AE',
        scope: {},
        controller: 'commissar.directives.Media.controller'
      };
    return Media;
  });
  return MediaModule;
});
define('services/ImageManager', [
  './Authentication',
  './Couch'
], function () {
  var ImageManagerModule = angular.module('commissar.services.ImageManager', [
      'commissar.services.Authentication',
      'commissar.services.Couch'
    ]);
  ImageManagerModule.factory('ImageManager', [
    'Authentication',
    'Couch',
    '$q',
    '$http',
    function (Authentication, Couch, $q, $http) {
      var ImageManager = {};
      ImageManager.getMyImages = function () {
        var deferred = $q.defer();
        Authentication.getUsername().then(function (username) {
          $http.get('/couchdb/' + Authentication.getDatabaseName(username) + '/_design/validation_user_media/_view/all').success(function (data) {
            deferred.resolve(data['rows']);
          }).error(deferred.reject);
        }, deferred.reject);
        return deferred.promise;
      };
      return ImageManager;
    }
  ]);
  return ImageManagerModule;
});
define('controllers/GalleryCtrl', [
  'constants',
  'directives/UploadForm',
  'directives/Media',
  'services/ImageManager',
  'services/ParanoidScope'
], function (constants) {
  var GalleryCtrlModule = angular.module('commissar.controllers.GalleryCtrl', [
      'commissar.directives.UploadForm',
      'commissar.directives.Media',
      'commissar.services.ImageManager',
      'commissar.services.ParanoidScope'
    ]);
  GalleryCtrlModule.controller('GalleryCtrl', [
    '$scope',
    'ImageManager',
    'ParanoidScope',
    function ($scope, ImageManager, ParanoidScope) {
      $scope.name = 'GalleryCtrl';
      ImageManager.getMyImages().then(function (data) {
        ParanoidScope.apply($scope, function () {
          $scope.images = data;
        });
      });
    }
  ]);
  GalleryCtrlModule.config([
    '$routeProvider',
    function ($routeProvider) {
      $routeProvider.when('/my/gallery', {
        templateUrl: constants.templatePrefix + 'gallery/index.html',
        controller: 'GalleryCtrl'
      });
      $routeProvider.when('/my/gallery/upload', {
        templateUrl: constants.templatePrefix + 'gallery/upload.html',
        controller: 'GalleryCtrl'
      });
      $routeProvider.when('/:userslug/gallery', {
        templateUrl: constants.templatePrefix + 'gallery/index.html',
        controller: 'GalleryCtrl'
      });
    }
  ]);
  return GalleryCtrlModule;
});
define('app', [
  'controllers/LogoutCtrl',
  'controllers/AdminCtrl',
  'controllers/IndexCtrl',
  'controllers/WelcomeCtrl',
  'controllers/MenuCtrl',
  'controllers/GalleryCtrl'
], function () {
  var App = angular.module('commissar', [
      'commissar.controllers.LogoutCtrl',
      'commissar.controllers.AdminCtrl',
      'commissar.controllers.IndexCtrl',
      'commissar.controllers.MenuCtrl',
      'commissar.controllers.WelcomeCtrl',
      'commissar.controllers.GalleryCtrl'
    ]);
  App.config([
    '$locationProvider',
    function ($locationProvider) {
      $locationProvider.html5Mode(false);
      $locationProvider.hashPrefix('!');
    }
  ]);
  return App;
});
angular.mock = {};
angular.mock.$BrowserProvider = function () {
  this.$get = function () {
    return new angular.mock.$Browser();
  };
};
angular.mock.$Browser = function () {
  var self = this;
  this.isMock = true;
  self.$$url = 'http://server/';
  self.$$lastUrl = self.$$url;
  self.pollFns = [];
  self.$$completeOutstandingRequest = angular.noop;
  self.$$incOutstandingRequestCount = angular.noop;
  self.onUrlChange = function (listener) {
    self.pollFns.push(function () {
      if (self.$$lastUrl != self.$$url) {
        self.$$lastUrl = self.$$url;
        listener(self.$$url);
      }
    });
    return listener;
  };
  self.cookieHash = {};
  self.lastCookieHash = {};
  self.deferredFns = [];
  self.deferredNextId = 0;
  self.defer = function (fn, delay) {
    delay = delay || 0;
    self.deferredFns.push({
      time: self.defer.now + delay,
      fn: fn,
      id: self.deferredNextId
    });
    self.deferredFns.sort(function (a, b) {
      return a.time - b.time;
    });
    return self.deferredNextId++;
  };
  self.defer.now = 0;
  self.defer.cancel = function (deferId) {
    var fnIndex;
    angular.forEach(self.deferredFns, function (fn, index) {
      if (fn.id === deferId)
        fnIndex = index;
    });
    if (fnIndex !== undefined) {
      self.deferredFns.splice(fnIndex, 1);
      return true;
    }
    return false;
  };
  self.defer.flush = function (delay) {
    if (angular.isDefined(delay)) {
      self.defer.now += delay;
    } else {
      if (self.deferredFns.length) {
        self.defer.now = self.deferredFns[self.deferredFns.length - 1].time;
      } else {
        throw Error('No deferred tasks to be flushed');
      }
    }
    while (self.deferredFns.length && self.deferredFns[0].time <= self.defer.now) {
      self.deferredFns.shift().fn();
    }
  };
  self.$$baseHref = '';
  self.baseHref = function () {
    return this.$$baseHref;
  };
};
angular.mock.$Browser.prototype = {
  poll: function poll() {
    angular.forEach(this.pollFns, function (pollFn) {
      pollFn();
    });
  },
  addPollFn: function (pollFn) {
    this.pollFns.push(pollFn);
    return pollFn;
  },
  url: function (url, replace) {
    if (url) {
      this.$$url = url;
      return this;
    }
    return this.$$url;
  },
  cookies: function (name, value) {
    if (name) {
      if (value == undefined) {
        delete this.cookieHash[name];
      } else {
        if (angular.isString(value) && value.length <= 4096) {
          this.cookieHash[name] = value;
        }
      }
    } else {
      if (!angular.equals(this.cookieHash, this.lastCookieHash)) {
        this.lastCookieHash = angular.copy(this.cookieHash);
        this.cookieHash = angular.copy(this.cookieHash);
      }
      return this.cookieHash;
    }
  },
  notifyWhenNoOutstandingRequests: function (fn) {
    fn();
  }
};
angular.mock.$ExceptionHandlerProvider = function () {
  var handler;
  this.mode = function (mode) {
    switch (mode) {
    case 'rethrow':
      handler = function (e) {
        throw e;
      };
      break;
    case 'log':
      var errors = [];
      handler = function (e) {
        if (arguments.length == 1) {
          errors.push(e);
        } else {
          errors.push([].slice.call(arguments, 0));
        }
      };
      handler.errors = errors;
      break;
    default:
      throw Error('Unknown mode \'' + mode + '\', only \'log\'/\'rethrow\' modes are allowed!');
    }
  };
  this.$get = function () {
    return handler;
  };
  this.mode('rethrow');
};
angular.mock.$LogProvider = function () {
  function concat(array1, array2, index) {
    return array1.concat(Array.prototype.slice.call(array2, index));
  }
  this.$get = function () {
    var $log = {
        log: function () {
          $log.log.logs.push(concat([], arguments, 0));
        },
        warn: function () {
          $log.warn.logs.push(concat([], arguments, 0));
        },
        info: function () {
          $log.info.logs.push(concat([], arguments, 0));
        },
        error: function () {
          $log.error.logs.push(concat([], arguments, 0));
        }
      };
    $log.reset = function () {
      $log.log.logs = [];
      $log.warn.logs = [];
      $log.info.logs = [];
      $log.error.logs = [];
    };
    $log.assertEmpty = function () {
      var errors = [];
      angular.forEach([
        'error',
        'warn',
        'info',
        'log'
      ], function (logLevel) {
        angular.forEach($log[logLevel].logs, function (log) {
          angular.forEach(log, function (logItem) {
            errors.push('MOCK $log (' + logLevel + '): ' + String(logItem) + '\n' + (logItem.stack || ''));
          });
        });
      });
      if (errors.length) {
        errors.unshift('Expected $log to be empty! Either a message was logged unexpectedly, or an expected ' + 'log message was not checked and removed:');
        errors.push('');
        throw new Error(errors.join('\n---------\n'));
      }
    };
    $log.reset();
    return $log;
  };
};
(function () {
  var R_ISO8061_STR = /^(\d{4})-?(\d\d)-?(\d\d)(?:T(\d\d)(?:\:?(\d\d)(?:\:?(\d\d)(?:\.(\d{3}))?)?)?(Z|([+-])(\d\d):?(\d\d)))?$/;
  function jsonStringToDate(string) {
    var match;
    if (match = string.match(R_ISO8061_STR)) {
      var date = new Date(0), tzHour = 0, tzMin = 0;
      if (match[9]) {
        tzHour = int(match[9] + match[10]);
        tzMin = int(match[9] + match[11]);
      }
      date.setUTCFullYear(int(match[1]), int(match[2]) - 1, int(match[3]));
      date.setUTCHours(int(match[4] || 0) - tzHour, int(match[5] || 0) - tzMin, int(match[6] || 0), int(match[7] || 0));
      return date;
    }
    return string;
  }
  function int(str) {
    return parseInt(str, 10);
  }
  function padNumber(num, digits, trim) {
    var neg = '';
    if (num < 0) {
      neg = '-';
      num = -num;
    }
    num = '' + num;
    while (num.length < digits)
      num = '0' + num;
    if (trim)
      num = num.substr(num.length - digits);
    return neg + num;
  }
  angular.mock.TzDate = function (offset, timestamp) {
    var self = new Date(0);
    if (angular.isString(timestamp)) {
      var tsStr = timestamp;
      self.origDate = jsonStringToDate(timestamp);
      timestamp = self.origDate.getTime();
      if (isNaN(timestamp))
        throw {
          name: 'Illegal Argument',
          message: 'Arg \'' + tsStr + '\' passed into TzDate constructor is not a valid date string'
        };
    } else {
      self.origDate = new Date(timestamp);
    }
    var localOffset = new Date(timestamp).getTimezoneOffset();
    self.offsetDiff = localOffset * 60 * 1000 - offset * 1000 * 60 * 60;
    self.date = new Date(timestamp + self.offsetDiff);
    self.getTime = function () {
      return self.date.getTime() - self.offsetDiff;
    };
    self.toLocaleDateString = function () {
      return self.date.toLocaleDateString();
    };
    self.getFullYear = function () {
      return self.date.getFullYear();
    };
    self.getMonth = function () {
      return self.date.getMonth();
    };
    self.getDate = function () {
      return self.date.getDate();
    };
    self.getHours = function () {
      return self.date.getHours();
    };
    self.getMinutes = function () {
      return self.date.getMinutes();
    };
    self.getSeconds = function () {
      return self.date.getSeconds();
    };
    self.getTimezoneOffset = function () {
      return offset * 60;
    };
    self.getUTCFullYear = function () {
      return self.origDate.getUTCFullYear();
    };
    self.getUTCMonth = function () {
      return self.origDate.getUTCMonth();
    };
    self.getUTCDate = function () {
      return self.origDate.getUTCDate();
    };
    self.getUTCHours = function () {
      return self.origDate.getUTCHours();
    };
    self.getUTCMinutes = function () {
      return self.origDate.getUTCMinutes();
    };
    self.getUTCSeconds = function () {
      return self.origDate.getUTCSeconds();
    };
    self.getUTCMilliseconds = function () {
      return self.origDate.getUTCMilliseconds();
    };
    self.getDay = function () {
      return self.date.getDay();
    };
    if (self.toISOString) {
      self.toISOString = function () {
        return padNumber(self.origDate.getUTCFullYear(), 4) + '-' + padNumber(self.origDate.getUTCMonth() + 1, 2) + '-' + padNumber(self.origDate.getUTCDate(), 2) + 'T' + padNumber(self.origDate.getUTCHours(), 2) + ':' + padNumber(self.origDate.getUTCMinutes(), 2) + ':' + padNumber(self.origDate.getUTCSeconds(), 2) + '.' + padNumber(self.origDate.getUTCMilliseconds(), 3) + 'Z';
      };
    }
    var unimplementedMethods = [
        'getMilliseconds',
        'getUTCDay',
        'getYear',
        'setDate',
        'setFullYear',
        'setHours',
        'setMilliseconds',
        'setMinutes',
        'setMonth',
        'setSeconds',
        'setTime',
        'setUTCDate',
        'setUTCFullYear',
        'setUTCHours',
        'setUTCMilliseconds',
        'setUTCMinutes',
        'setUTCMonth',
        'setUTCSeconds',
        'setYear',
        'toDateString',
        'toGMTString',
        'toJSON',
        'toLocaleFormat',
        'toLocaleString',
        'toLocaleTimeString',
        'toSource',
        'toString',
        'toTimeString',
        'toUTCString',
        'valueOf'
      ];
    angular.forEach(unimplementedMethods, function (methodName) {
      self[methodName] = function () {
        throw Error('Method \'' + methodName + '\' is not implemented in the TzDate mock');
      };
    });
    return self;
  };
  angular.mock.TzDate.prototype = Date.prototype;
}());
angular.mock.dump = function (object) {
  return serialize(object);
  function serialize(object) {
    var out;
    if (angular.isElement(object)) {
      object = angular.element(object);
      out = angular.element('<div></div>');
      angular.forEach(object, function (element) {
        out.append(angular.element(element).clone());
      });
      out = out.html();
    } else if (angular.isArray(object)) {
      out = [];
      angular.forEach(object, function (o) {
        out.push(serialize(o));
      });
      out = '[ ' + out.join(', ') + ' ]';
    } else if (angular.isObject(object)) {
      if (angular.isFunction(object.$eval) && angular.isFunction(object.$apply)) {
        out = serializeScope(object);
      } else if (object instanceof Error) {
        out = object.stack || '' + object.name + ': ' + object.message;
      } else {
        out = angular.toJson(object, true);
      }
    } else {
      out = String(object);
    }
    return out;
  }
  function serializeScope(scope, offset) {
    offset = offset || '  ';
    var log = [offset + 'Scope(' + scope.$id + '): {'];
    for (var key in scope) {
      if (scope.hasOwnProperty(key) && !key.match(/^(\$|this)/)) {
        log.push('  ' + key + ': ' + angular.toJson(scope[key]));
      }
    }
    var child = scope.$$childHead;
    while (child) {
      log.push(serializeScope(child, offset + '  '));
      child = child.$$nextSibling;
    }
    log.push('}');
    return log.join('\n' + offset);
  }
};
angular.mock.$HttpBackendProvider = function () {
  this.$get = [createHttpBackendMock];
};
function createHttpBackendMock($delegate, $browser) {
  var definitions = [], expectations = [], responses = [], responsesPush = angular.bind(responses, responses.push);
  function createResponse(status, data, headers) {
    if (angular.isFunction(status))
      return status;
    return function () {
      return angular.isNumber(status) ? [
        status,
        data,
        headers
      ] : [
        200,
        status,
        data
      ];
    };
  }
  function $httpBackend(method, url, data, callback, headers) {
    var xhr = new MockXhr(), expectation = expectations[0], wasExpected = false;
    function prettyPrint(data) {
      return angular.isString(data) || angular.isFunction(data) || data instanceof RegExp ? data : angular.toJson(data);
    }
    if (expectation && expectation.match(method, url)) {
      if (!expectation.matchData(data))
        throw Error('Expected ' + expectation + ' with different data\n' + 'EXPECTED: ' + prettyPrint(expectation.data) + '\nGOT:      ' + data);
      if (!expectation.matchHeaders(headers))
        throw Error('Expected ' + expectation + ' with different headers\n' + 'EXPECTED: ' + prettyPrint(expectation.headers) + '\nGOT:      ' + prettyPrint(headers));
      expectations.shift();
      if (expectation.response) {
        responses.push(function () {
          var response = expectation.response(method, url, data, headers);
          xhr.$$respHeaders = response[2];
          callback(response[0], response[1], xhr.getAllResponseHeaders());
        });
        return;
      }
      wasExpected = true;
    }
    var i = -1, definition;
    while (definition = definitions[++i]) {
      if (definition.match(method, url, data, headers || {})) {
        if (definition.response) {
          ($browser ? $browser.defer : responsesPush)(function () {
            var response = definition.response(method, url, data, headers);
            xhr.$$respHeaders = response[2];
            callback(response[0], response[1], xhr.getAllResponseHeaders());
          });
        } else if (definition.passThrough) {
          $delegate(method, url, data, callback, headers);
        } else
          throw Error('No response defined !');
        return;
      }
    }
    throw wasExpected ? Error('No response defined !') : Error('Unexpected request: ' + method + ' ' + url + '\n' + (expectation ? 'Expected ' + expectation : 'No more request expected'));
  }
  $httpBackend.when = function (method, url, data, headers) {
    var definition = new MockHttpExpectation(method, url, data, headers), chain = {
        respond: function (status, data, headers) {
          definition.response = createResponse(status, data, headers);
        }
      };
    if ($browser) {
      chain.passThrough = function () {
        definition.passThrough = true;
      };
    }
    definitions.push(definition);
    return chain;
  };
  createShortMethods('when');
  $httpBackend.expect = function (method, url, data, headers) {
    var expectation = new MockHttpExpectation(method, url, data, headers);
    expectations.push(expectation);
    return {
      respond: function (status, data, headers) {
        expectation.response = createResponse(status, data, headers);
      }
    };
  };
  createShortMethods('expect');
  $httpBackend.flush = function (count) {
    if (!responses.length)
      throw Error('No pending request to flush !');
    if (angular.isDefined(count)) {
      while (count--) {
        if (!responses.length)
          throw Error('No more pending request to flush !');
        responses.shift()();
      }
    } else {
      while (responses.length) {
        responses.shift()();
      }
    }
    $httpBackend.verifyNoOutstandingExpectation();
  };
  $httpBackend.verifyNoOutstandingExpectation = function () {
    if (expectations.length) {
      throw Error('Unsatisfied requests: ' + expectations.join(', '));
    }
  };
  $httpBackend.verifyNoOutstandingRequest = function () {
    if (responses.length) {
      throw Error('Unflushed requests: ' + responses.length);
    }
  };
  $httpBackend.resetExpectations = function () {
    expectations.length = 0;
    responses.length = 0;
  };
  return $httpBackend;
  function createShortMethods(prefix) {
    angular.forEach([
      'GET',
      'DELETE',
      'JSONP'
    ], function (method) {
      $httpBackend[prefix + method] = function (url, headers) {
        return $httpBackend[prefix](method, url, undefined, headers);
      };
    });
    angular.forEach([
      'PUT',
      'POST',
      'PATCH'
    ], function (method) {
      $httpBackend[prefix + method] = function (url, data, headers) {
        return $httpBackend[prefix](method, url, data, headers);
      };
    });
  }
}
function MockHttpExpectation(method, url, data, headers) {
  this.data = data;
  this.headers = headers;
  this.match = function (m, u, d, h) {
    if (method != m)
      return false;
    if (!this.matchUrl(u))
      return false;
    if (angular.isDefined(d) && !this.matchData(d))
      return false;
    if (angular.isDefined(h) && !this.matchHeaders(h))
      return false;
    return true;
  };
  this.matchUrl = function (u) {
    if (!url)
      return true;
    if (angular.isFunction(url.test))
      return url.test(u);
    return url == u;
  };
  this.matchHeaders = function (h) {
    if (angular.isUndefined(headers))
      return true;
    if (angular.isFunction(headers))
      return headers(h);
    return angular.equals(headers, h);
  };
  this.matchData = function (d) {
    if (angular.isUndefined(data))
      return true;
    if (data && angular.isFunction(data.test))
      return data.test(d);
    if (data && !angular.isString(data))
      return angular.toJson(data) == d;
    return data == d;
  };
  this.toString = function () {
    return method + ' ' + url;
  };
}
function MockXhr() {
  MockXhr.$$lastInstance = this;
  this.open = function (method, url, async) {
    this.$$method = method;
    this.$$url = url;
    this.$$async = async;
    this.$$reqHeaders = {};
    this.$$respHeaders = {};
  };
  this.send = function (data) {
    this.$$data = data;
  };
  this.setRequestHeader = function (key, value) {
    this.$$reqHeaders[key] = value;
  };
  this.getResponseHeader = function (name) {
    var header = this.$$respHeaders[name];
    if (header)
      return header;
    name = angular.lowercase(name);
    header = this.$$respHeaders[name];
    if (header)
      return header;
    header = undefined;
    angular.forEach(this.$$respHeaders, function (headerVal, headerName) {
      if (!header && angular.lowercase(headerName) == name)
        header = headerVal;
    });
    return header;
  };
  this.getAllResponseHeaders = function () {
    var lines = [];
    angular.forEach(this.$$respHeaders, function (value, key) {
      lines.push(key + ': ' + value);
    });
    return lines.join('\n');
  };
  this.abort = angular.noop;
}
angular.mock.$RootElementProvider = function () {
  this.$get = function () {
    return angular.element('<div ng-app></div>');
  };
};
angular.module('ngMock', ['ng']).provider({
  $browser: angular.mock.$BrowserProvider,
  $exceptionHandler: angular.mock.$ExceptionHandlerProvider,
  $log: angular.mock.$LogProvider,
  $httpBackend: angular.mock.$HttpBackendProvider,
  $rootElement: angular.mock.$RootElementProvider
}).config(function ($provide) {
  $provide.decorator('$timeout', function ($delegate, $browser) {
    $delegate.flush = function (delay) {
      $browser.defer.flush(delay);
    };
    return $delegate;
  });
});
angular.module('ngMockE2E', ['ng']).config([
  '$provide',
  function ($provide) {
    $provide.decorator('$httpBackend', angular.mock.e2e.$httpBackendDecorator);
  }
]);
angular.mock.e2e = {};
angular.mock.e2e.$httpBackendDecorator = [
  '$delegate',
  '$browser',
  createHttpBackendMock
];
angular.mock.clearDataCache = function () {
  var key, cache = angular.element.cache;
  for (key in cache) {
    if (cache.hasOwnProperty(key)) {
      var handle = cache[key].handle;
      handle && angular.element(handle.elem).unbind();
      delete cache[key];
    }
  }
};
window.jasmine && function (window) {
  afterEach(function () {
    var spec = getCurrentSpec();
    var injector = spec.$injector;
    spec.$injector = null;
    spec.$modules = null;
    if (injector) {
      injector.get('$rootElement').unbind();
      injector.get('$browser').pollFns.length = 0;
    }
    angular.mock.clearDataCache();
    angular.forEach(angular.element.fragments, function (val, key) {
      delete angular.element.fragments[key];
    });
    MockXhr.$$lastInstance = null;
    angular.forEach(angular.callbacks, function (val, key) {
      delete angular.callbacks[key];
    });
    angular.callbacks.counter = 0;
  });
  function getCurrentSpec() {
    return jasmine.getEnv().currentSpec;
  }
  function isSpecRunning() {
    var spec = getCurrentSpec();
    return spec && spec.queue.running;
  }
  window.module = angular.mock.module = function () {
    var moduleFns = Array.prototype.slice.call(arguments, 0);
    return isSpecRunning() ? workFn() : workFn;
    function workFn() {
      var spec = getCurrentSpec();
      if (spec.$injector) {
        throw Error('Injector already created, can not register a module!');
      } else {
        var modules = spec.$modules || (spec.$modules = []);
        angular.forEach(moduleFns, function (module) {
          modules.push(module);
        });
      }
    }
  };
  window.inject = angular.mock.inject = function () {
    var blockFns = Array.prototype.slice.call(arguments, 0);
    var errorForStack = new Error('Declaration Location');
    return isSpecRunning() ? workFn() : workFn;
    function workFn() {
      var spec = getCurrentSpec();
      var modules = spec.$modules || [];
      modules.unshift('ngMock');
      modules.unshift('ng');
      var injector = spec.$injector;
      if (!injector) {
        injector = spec.$injector = angular.injector(modules);
      }
      for (var i = 0, ii = blockFns.length; i < ii; i++) {
        try {
          injector.invoke(blockFns[i] || angular.noop, this);
        } catch (e) {
          if (e.stack && errorForStack)
            e.stack += '\n' + errorForStack.stack;
          throw e;
        } finally {
          errorForStack = null;
        }
      }
    }
  };
}(window);
define('angularMocks', function () {
});
define('startup', [
  'app',
  'angularMocks'
], function (app) {
  return function () {
    if (window.e2emocks) {
      console.log('RUNNING MOCKED');
      var mockedApp = angular.module('commissar_mocked', [
          'commissar',
          'ngMockE2E'
        ]);
      mockedApp.run([
        '$httpBackend',
        function ($httpBackend) {
          $httpBackend.whenGET('/couchdb/_all_dbs').respond(200, [
            '_replicator',
            '_users',
            'commissar',
            'commissar_user_john',
            'commissar_validation_global',
            'commissar_validation_users'
          ]);
          $httpBackend.whenPOST('/server/register.php').respond(200, { 'ok': true });
          $httpBackend.whenGET('/couchdb/_session').respond(200, {
            ok: false,
            userCtx: {
              name: null,
              roles: []
            },
            info: {
              authentication_db: '_users',
              authentication_handlers: [
                'oauth',
                'cookie',
                'default'
              ]
            }
          });
          $httpBackend.whenPOST('/couchdb/_session').respond(200, {
            ok: true,
            name: 'a_new_username',
            roles: ['+admin']
          });
          $httpBackend.whenGET(/templates/).passThrough();
          $httpBackend.whenGET(/.*/).respond(404, 'NOT SET UP IN E2EMOCKS YET');
        }
      ]);
      app = mockedApp;
    }
    var html = document.getElementsByTagName('html')[0];
    html.setAttribute('ng-app', app['name']);
    html.dataset.ngApp = app['name'];
    if (top !== window) {
      top.postMessage({ type: 'apploaded' }, '*');
      console.log('Posted message!');
    }
    console.log(angular.module('commissar'));
    if (window.useTemplateModule) {
      var templatedApp = angular.module('commissar_templated', [app['name']]);
      require(['/js/templates.min.js'], function (templates) {
        templates(templatedApp);
        angular.bootstrap(document, [templatedApp['name']]);
      });
    } else {
      console.log('RUNNING WITHOUT TEMPLATE MODULE');
      angular.bootstrap(document, [app['name']]);
    }
  };
});