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
      CouchDoc.prototype.attach = function (file, name, reloadCB) {
        var doc = this;
        if (ng.isFunction(name)) {
          reloadCB = name;
          name = null;
        }
        return $http({
          method: 'PUT',
          url: encodeUri(dbUri, doc._id, name || file.name),
          params: { rev: doc._rev },
          headers: { 'Content-Type': file.type },
          data: file
        }).success(function () {
          doc.load().success(reloadCB || ng.noop);
        });
      };
      CouchDoc.prototype.attachMulti = function (files, successCB) {
        var doc = this;
        var idx = 0;
        function loopCB() {
          if (idx < files.length)
            doc.attach(files[idx], ++idx < files.length ? loopCB : successCB);
        }
        ;
        loopCB();
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
      this.queryActive = false;
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
      db.queryActive = true;
      return $http(db.qConfig).success(function (data, dt, hd, config) {
        if (config.params && config.params.limit) {
          if (data.rows.length === config.params.limit) {
            db.nextRow = data.rows.pop();
          } else {
            db.nextRow = null;
          }
        }
        if (config.append) {
          for (var i in data.rows)
            db.rows.push(data.rows[i]);
          delete db.qConfig.append;
        } else {
          db.rows = data.rows;
        }
        db.queryActive = false;
      }).error(function () {
        db.queryActive = false;
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
      if (row && !this.queryActive) {
        this.prevRows.push(this.rows[0]);
        this.qConfig.params.startkey = ng.toJson(row.key);
        if (row.id && row.id !== row.key)
          this.qConfig.params.startkey_docid = row.id;
        return executeQuery(this);
      } else
        return null;
    };
    CouchDB.prototype.queryMore = function () {
      var row = this.nextRow;
      if (row && !this.queryActive) {
        this.qConfig.params.startkey = ng.toJson(row.key);
        if (row.id && row.id !== row.key)
          this.qConfig.params.startkey_docid = row.id;
        this.qConfig.append = true;
        return executeQuery(this);
      } else
        return null;
    };
    CouchDB.prototype.queryPrev = function () {
      var row = this.prevRows.pop();
      if (row && !this.queryActive) {
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
        if (this.method !== 'JSONP') {
          $http.defaults.withCredentials = true;
        }
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
                  if (userCtx.roles.indexOf('_admin') !== -1) {
                    return null;
                  }
                  if (!newDoc._deleted) {
                    if (!newDoc.type) {
                      throw { forbidden: 'All documents must have a type' };
                    }
                    if (userCtx.db !== 'commissar_user_' + userCtx.name && userCtx.roles.indexOf('+admin') === -1) {
                      throw { forbidden: 'Cannot alter documents outside your own database' };
                    }
                    if (newDoc.created) {
                      if (String(parseInt(newDoc.created, 10)) !== String(newDoc.created)) {
                        throw { forbidden: 'Created timestamp must be in unix format' };
                      }
                      if (oldDoc && typeof oldDoc.created !== 'undefined' && newDoc.created !== oldDoc.created) {
                        throw { forbidden: 'Cannot alter created timestamp once set' };
                      }
                    }
                    if (newDoc.updated && String(parseInt(newDoc.updated, 10)) !== String(newDoc.updated)) {
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
                  if (userCtx.roles.indexOf('_admin') !== -1) {
                    return null;
                  }
                  if (typeof newDoc._id === 'undefined') {
                    throw { forbidden: 'ID is missing' };
                  }
                  if (!newDoc.author && oldDoc && !newDoc._deleted) {
                    throw { forbidden: 'Cannot create a document without an author field' };
                  }
                  if (newDoc.author !== userCtx.name && userCtx.roles.indexOf('+admin') === -1 && oldDoc && !newDoc._deleted) {
                    throw { forbidden: 'Cannot forge authorship as another user' };
                  }
                  if (newDoc._id.indexOf(newDoc.author) !== 0 && oldDoc && !newDoc._deleted) {
                    throw { forbidden: 'IDs must start with your username' };
                  }
                  if (oldDoc && oldDoc.type && newDoc.type !== oldDoc.type && !newDoc._deleted) {
                    throw { forbidden: 'Cannot change the type of a document' };
                  }
                  if (oldDoc && oldDoc.author && newDoc.author !== oldDoc.author && !newDoc._deleted) {
                    throw { forbidden: 'Cannot change the author of a document' };
                  }
                  if (!newDoc.author && !oldDoc) {
                    throw { forbidden: 'Cannot create a document without an author field' };
                  }
                  if (newDoc.author !== userCtx.name && userCtx.roles.indexOf('+admin') === -1 && !oldDoc) {
                    throw { forbidden: 'Cannot forge authorship as another user' };
                  }
                  if (newDoc._id.indexOf(newDoc.author) !== 0 && !oldDoc) {
                    throw { forbidden: 'IDs must start with your username' };
                  }
                  if (newDoc._deleted && oldDoc && oldDoc.author !== userCtx.name && userCtx.roles.indexOf('+admin') === -1) {
                    throw { forbidden: 'Cannot delete as you are not the author' };
                  }
                },
                'filters': {
                  'isPublished': function () {
                  }
                }
              },
              '_design/validation_user_media': {
                _id: '_design/validation_user_media',
                language: 'javascript',
                validate_doc_update: function (newDoc, oldDoc, userCtx) {
                  if (userCtx.roles.indexOf('_admin') !== -1) {
                    return null;
                  }
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
                  },
                  noThumbnails: {
                    map: function (document) {
                      if (document.type && document.type === 'media' && !document.thumbnails) {
                        emit(null, document);
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
              remoteDocument.save().then(function (reply) {
                document._rev = reply.data.rev;
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
      $scope.errors = [];
      $scope.valid = function () {
        $scope.errors = [];
        if (!$scope.uploadFormName) {
          $scope.errors.push('Your masterpiece needs a title');
        }
        if (!$scope.uploadFormFile) {
          $scope.errors.push('You haven\'t selected a file to upload');
        }
        return !$scope.errors.length;
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
define('controllers/UploadCtrl', [
  'constants',
  'directives/UploadForm',
  'services/ParanoidScope'
], function (constants) {
  var UploadCtrlModule = angular.module('commissar.controllers.UploadCtrl', [
      'commissar.directives.UploadForm',
      'commissar.services.ParanoidScope'
    ]);
  UploadCtrlModule.controller('UploadCtrl', [
    '$scope',
    function ($scope) {
      $scope.name = 'UploadCtrl';
    }
  ]);
  UploadCtrlModule.config([
    '$routeProvider',
    function ($routeProvider) {
      $routeProvider.when('/my/gallery/upload', {
        templateUrl: constants.templatePrefix + 'gallery/upload.html',
        controller: 'UploadCtrl'
      });
    }
  ]);
  return UploadCtrlModule;
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
          $http.get('/couchdb/' + Authentication.getDatabaseName(username) + '/_design/validation_user_media/_view/all?descending=true').success(function (data) {
            deferred.resolve(data['rows']);
          }).error(deferred.reject);
        }, deferred.reject);
        return deferred.promise;
      };
      ImageManager.save = function (document) {
        var deferred = $q.defer();
        Authentication.getUsername().then(function (username) {
          if (document.author !== username) {
            deferred.reject();
            return false;
          }
          Couch.applyStaticChanges(Authentication.getDatabaseName(username), document).then(deferred.resolve, deferred.reject);
        });
        return deferred.promise;
      };
      return ImageManager;
    }
  ]);
  return ImageManagerModule;
});
define('filters/NotThumbnail', [], function () {
  var NotThumbnailModule = angular.module('commissar.filters.NotThumbnail', []);
  NotThumbnailModule.filter('NotThumbnail', function () {
    return function (input) {
      if (input) {
        var array = {};
        angular.forEach(input, function (attachment, filename) {
          if (filename.indexOf('__thumb_') < 0) {
            array[filename] = attachment;
          }
        });
        return array;
      } else {
        return null;
      }
    };
  });
});
(function (undefined) {
  var moment, VERSION = '2.5.1', global = this, round = Math.round, i, YEAR = 0, MONTH = 1, DATE = 2, HOUR = 3, MINUTE = 4, SECOND = 5, MILLISECOND = 6, languages = {}, momentProperties = {
      _isAMomentObject: null,
      _i: null,
      _f: null,
      _l: null,
      _strict: null,
      _isUTC: null,
      _offset: null,
      _pf: null,
      _lang: null
    }, hasModule = typeof module !== 'undefined' && module.exports && typeof require !== 'undefined', aspNetJsonRegex = /^\/?Date\((\-?\d+)/i, aspNetTimeSpanJsonRegex = /(\-)?(?:(\d*)\.)?(\d+)\:(\d+)(?:\:(\d+)\.?(\d{3})?)?/, isoDurationRegex = /^(-)?P(?:(?:([0-9,.]*)Y)?(?:([0-9,.]*)M)?(?:([0-9,.]*)D)?(?:T(?:([0-9,.]*)H)?(?:([0-9,.]*)M)?(?:([0-9,.]*)S)?)?|([0-9,.]*)W)$/, formattingTokens = /(\[[^\[]*\])|(\\)?(Mo|MM?M?M?|Do|DDDo|DD?D?D?|ddd?d?|do?|w[o|w]?|W[o|W]?|YYYYYY|YYYYY|YYYY|YY|gg(ggg?)?|GG(GGG?)?|e|E|a|A|hh?|HH?|mm?|ss?|S{1,4}|X|zz?|ZZ?|.)/g, localFormattingTokens = /(\[[^\[]*\])|(\\)?(LT|LL?L?L?|l{1,4})/g, parseTokenOneOrTwoDigits = /\d\d?/, parseTokenOneToThreeDigits = /\d{1,3}/, parseTokenOneToFourDigits = /\d{1,4}/, parseTokenOneToSixDigits = /[+\-]?\d{1,6}/, parseTokenDigits = /\d+/, parseTokenWord = /[0-9]*['a-z\u00A0-\u05FF\u0700-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]+|[\u0600-\u06FF\/]+(\s*?[\u0600-\u06FF]+){1,2}/i, parseTokenTimezone = /Z|[\+\-]\d\d:?\d\d/gi, parseTokenT = /T/i, parseTokenTimestampMs = /[\+\-]?\d+(\.\d{1,3})?/, parseTokenOneDigit = /\d/, parseTokenTwoDigits = /\d\d/, parseTokenThreeDigits = /\d{3}/, parseTokenFourDigits = /\d{4}/, parseTokenSixDigits = /[+-]?\d{6}/, parseTokenSignedNumber = /[+-]?\d+/, isoRegex = /^\s*(?:[+-]\d{6}|\d{4})-(?:(\d\d-\d\d)|(W\d\d$)|(W\d\d-\d)|(\d\d\d))((T| )(\d\d(:\d\d(:\d\d(\.\d+)?)?)?)?([\+\-]\d\d(?::?\d\d)?|\s*Z)?)?$/, isoFormat = 'YYYY-MM-DDTHH:mm:ssZ', isoDates = [
      [
        'YYYYYY-MM-DD',
        /[+-]\d{6}-\d{2}-\d{2}/
      ],
      [
        'YYYY-MM-DD',
        /\d{4}-\d{2}-\d{2}/
      ],
      [
        'GGGG-[W]WW-E',
        /\d{4}-W\d{2}-\d/
      ],
      [
        'GGGG-[W]WW',
        /\d{4}-W\d{2}/
      ],
      [
        'YYYY-DDD',
        /\d{4}-\d{3}/
      ]
    ], isoTimes = [
      [
        'HH:mm:ss.SSSS',
        /(T| )\d\d:\d\d:\d\d\.\d{1,3}/
      ],
      [
        'HH:mm:ss',
        /(T| )\d\d:\d\d:\d\d/
      ],
      [
        'HH:mm',
        /(T| )\d\d:\d\d/
      ],
      [
        'HH',
        /(T| )\d\d/
      ]
    ], parseTimezoneChunker = /([\+\-]|\d\d)/gi, proxyGettersAndSetters = 'Date|Hours|Minutes|Seconds|Milliseconds'.split('|'), unitMillisecondFactors = {
      'Milliseconds': 1,
      'Seconds': 1000,
      'Minutes': 60000,
      'Hours': 3600000,
      'Days': 86400000,
      'Months': 2592000000,
      'Years': 31536000000
    }, unitAliases = {
      ms: 'millisecond',
      s: 'second',
      m: 'minute',
      h: 'hour',
      d: 'day',
      D: 'date',
      w: 'week',
      W: 'isoWeek',
      M: 'month',
      y: 'year',
      DDD: 'dayOfYear',
      e: 'weekday',
      E: 'isoWeekday',
      gg: 'weekYear',
      GG: 'isoWeekYear'
    }, camelFunctions = {
      dayofyear: 'dayOfYear',
      isoweekday: 'isoWeekday',
      isoweek: 'isoWeek',
      weekyear: 'weekYear',
      isoweekyear: 'isoWeekYear'
    }, formatFunctions = {}, ordinalizeTokens = 'DDD w W M D d'.split(' '), paddedTokens = 'M D H h m s w W'.split(' '), formatTokenFunctions = {
      M: function () {
        return this.month() + 1;
      },
      MMM: function (format) {
        return this.lang().monthsShort(this, format);
      },
      MMMM: function (format) {
        return this.lang().months(this, format);
      },
      D: function () {
        return this.date();
      },
      DDD: function () {
        return this.dayOfYear();
      },
      d: function () {
        return this.day();
      },
      dd: function (format) {
        return this.lang().weekdaysMin(this, format);
      },
      ddd: function (format) {
        return this.lang().weekdaysShort(this, format);
      },
      dddd: function (format) {
        return this.lang().weekdays(this, format);
      },
      w: function () {
        return this.week();
      },
      W: function () {
        return this.isoWeek();
      },
      YY: function () {
        return leftZeroFill(this.year() % 100, 2);
      },
      YYYY: function () {
        return leftZeroFill(this.year(), 4);
      },
      YYYYY: function () {
        return leftZeroFill(this.year(), 5);
      },
      YYYYYY: function () {
        var y = this.year(), sign = y >= 0 ? '+' : '-';
        return sign + leftZeroFill(Math.abs(y), 6);
      },
      gg: function () {
        return leftZeroFill(this.weekYear() % 100, 2);
      },
      gggg: function () {
        return leftZeroFill(this.weekYear(), 4);
      },
      ggggg: function () {
        return leftZeroFill(this.weekYear(), 5);
      },
      GG: function () {
        return leftZeroFill(this.isoWeekYear() % 100, 2);
      },
      GGGG: function () {
        return leftZeroFill(this.isoWeekYear(), 4);
      },
      GGGGG: function () {
        return leftZeroFill(this.isoWeekYear(), 5);
      },
      e: function () {
        return this.weekday();
      },
      E: function () {
        return this.isoWeekday();
      },
      a: function () {
        return this.lang().meridiem(this.hours(), this.minutes(), true);
      },
      A: function () {
        return this.lang().meridiem(this.hours(), this.minutes(), false);
      },
      H: function () {
        return this.hours();
      },
      h: function () {
        return this.hours() % 12 || 12;
      },
      m: function () {
        return this.minutes();
      },
      s: function () {
        return this.seconds();
      },
      S: function () {
        return toInt(this.milliseconds() / 100);
      },
      SS: function () {
        return leftZeroFill(toInt(this.milliseconds() / 10), 2);
      },
      SSS: function () {
        return leftZeroFill(this.milliseconds(), 3);
      },
      SSSS: function () {
        return leftZeroFill(this.milliseconds(), 3);
      },
      Z: function () {
        var a = -this.zone(), b = '+';
        if (a < 0) {
          a = -a;
          b = '-';
        }
        return b + leftZeroFill(toInt(a / 60), 2) + ':' + leftZeroFill(toInt(a) % 60, 2);
      },
      ZZ: function () {
        var a = -this.zone(), b = '+';
        if (a < 0) {
          a = -a;
          b = '-';
        }
        return b + leftZeroFill(toInt(a / 60), 2) + leftZeroFill(toInt(a) % 60, 2);
      },
      z: function () {
        return this.zoneAbbr();
      },
      zz: function () {
        return this.zoneName();
      },
      X: function () {
        return this.unix();
      },
      Q: function () {
        return this.quarter();
      }
    }, lists = [
      'months',
      'monthsShort',
      'weekdays',
      'weekdaysShort',
      'weekdaysMin'
    ];
  function defaultParsingFlags() {
    return {
      empty: false,
      unusedTokens: [],
      unusedInput: [],
      overflow: -2,
      charsLeftOver: 0,
      nullInput: false,
      invalidMonth: null,
      invalidFormat: false,
      userInvalidated: false,
      iso: false
    };
  }
  function padToken(func, count) {
    return function (a) {
      return leftZeroFill(func.call(this, a), count);
    };
  }
  function ordinalizeToken(func, period) {
    return function (a) {
      return this.lang().ordinal(func.call(this, a), period);
    };
  }
  while (ordinalizeTokens.length) {
    i = ordinalizeTokens.pop();
    formatTokenFunctions[i + 'o'] = ordinalizeToken(formatTokenFunctions[i], i);
  }
  while (paddedTokens.length) {
    i = paddedTokens.pop();
    formatTokenFunctions[i + i] = padToken(formatTokenFunctions[i], 2);
  }
  formatTokenFunctions.DDDD = padToken(formatTokenFunctions.DDD, 3);
  function Language() {
  }
  function Moment(config) {
    checkOverflow(config);
    extend(this, config);
  }
  function Duration(duration) {
    var normalizedInput = normalizeObjectUnits(duration), years = normalizedInput.year || 0, months = normalizedInput.month || 0, weeks = normalizedInput.week || 0, days = normalizedInput.day || 0, hours = normalizedInput.hour || 0, minutes = normalizedInput.minute || 0, seconds = normalizedInput.second || 0, milliseconds = normalizedInput.millisecond || 0;
    this._milliseconds = +milliseconds + seconds * 1000 + minutes * 60000 + hours * 3600000;
    this._days = +days + weeks * 7;
    this._months = +months + years * 12;
    this._data = {};
    this._bubble();
  }
  function extend(a, b) {
    for (var i in b) {
      if (b.hasOwnProperty(i)) {
        a[i] = b[i];
      }
    }
    if (b.hasOwnProperty('toString')) {
      a.toString = b.toString;
    }
    if (b.hasOwnProperty('valueOf')) {
      a.valueOf = b.valueOf;
    }
    return a;
  }
  function cloneMoment(m) {
    var result = {}, i;
    for (i in m) {
      if (m.hasOwnProperty(i) && momentProperties.hasOwnProperty(i)) {
        result[i] = m[i];
      }
    }
    return result;
  }
  function absRound(number) {
    if (number < 0) {
      return Math.ceil(number);
    } else {
      return Math.floor(number);
    }
  }
  function leftZeroFill(number, targetLength, forceSign) {
    var output = '' + Math.abs(number), sign = number >= 0;
    while (output.length < targetLength) {
      output = '0' + output;
    }
    return (sign ? forceSign ? '+' : '' : '-') + output;
  }
  function addOrSubtractDurationFromMoment(mom, duration, isAdding, ignoreUpdateOffset) {
    var milliseconds = duration._milliseconds, days = duration._days, months = duration._months, minutes, hours;
    if (milliseconds) {
      mom._d.setTime(+mom._d + milliseconds * isAdding);
    }
    if (days || months) {
      minutes = mom.minute();
      hours = mom.hour();
    }
    if (days) {
      mom.date(mom.date() + days * isAdding);
    }
    if (months) {
      mom.month(mom.month() + months * isAdding);
    }
    if (milliseconds && !ignoreUpdateOffset) {
      moment.updateOffset(mom);
    }
    if (days || months) {
      mom.minute(minutes);
      mom.hour(hours);
    }
  }
  function isArray(input) {
    return Object.prototype.toString.call(input) === '[object Array]';
  }
  function isDate(input) {
    return Object.prototype.toString.call(input) === '[object Date]' || input instanceof Date;
  }
  function compareArrays(array1, array2, dontConvert) {
    var len = Math.min(array1.length, array2.length), lengthDiff = Math.abs(array1.length - array2.length), diffs = 0, i;
    for (i = 0; i < len; i++) {
      if (dontConvert && array1[i] !== array2[i] || !dontConvert && toInt(array1[i]) !== toInt(array2[i])) {
        diffs++;
      }
    }
    return diffs + lengthDiff;
  }
  function normalizeUnits(units) {
    if (units) {
      var lowered = units.toLowerCase().replace(/(.)s$/, '$1');
      units = unitAliases[units] || camelFunctions[lowered] || lowered;
    }
    return units;
  }
  function normalizeObjectUnits(inputObject) {
    var normalizedInput = {}, normalizedProp, prop;
    for (prop in inputObject) {
      if (inputObject.hasOwnProperty(prop)) {
        normalizedProp = normalizeUnits(prop);
        if (normalizedProp) {
          normalizedInput[normalizedProp] = inputObject[prop];
        }
      }
    }
    return normalizedInput;
  }
  function makeList(field) {
    var count, setter;
    if (field.indexOf('week') === 0) {
      count = 7;
      setter = 'day';
    } else if (field.indexOf('month') === 0) {
      count = 12;
      setter = 'month';
    } else {
      return;
    }
    moment[field] = function (format, index) {
      var i, getter, method = moment.fn._lang[field], results = [];
      if (typeof format === 'number') {
        index = format;
        format = undefined;
      }
      getter = function (i) {
        var m = moment().utc().set(setter, i);
        return method.call(moment.fn._lang, m, format || '');
      };
      if (index != null) {
        return getter(index);
      } else {
        for (i = 0; i < count; i++) {
          results.push(getter(i));
        }
        return results;
      }
    };
  }
  function toInt(argumentForCoercion) {
    var coercedNumber = +argumentForCoercion, value = 0;
    if (coercedNumber !== 0 && isFinite(coercedNumber)) {
      if (coercedNumber >= 0) {
        value = Math.floor(coercedNumber);
      } else {
        value = Math.ceil(coercedNumber);
      }
    }
    return value;
  }
  function daysInMonth(year, month) {
    return new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  }
  function daysInYear(year) {
    return isLeapYear(year) ? 366 : 365;
  }
  function isLeapYear(year) {
    return year % 4 === 0 && year % 100 !== 0 || year % 400 === 0;
  }
  function checkOverflow(m) {
    var overflow;
    if (m._a && m._pf.overflow === -2) {
      overflow = m._a[MONTH] < 0 || m._a[MONTH] > 11 ? MONTH : m._a[DATE] < 1 || m._a[DATE] > daysInMonth(m._a[YEAR], m._a[MONTH]) ? DATE : m._a[HOUR] < 0 || m._a[HOUR] > 23 ? HOUR : m._a[MINUTE] < 0 || m._a[MINUTE] > 59 ? MINUTE : m._a[SECOND] < 0 || m._a[SECOND] > 59 ? SECOND : m._a[MILLISECOND] < 0 || m._a[MILLISECOND] > 999 ? MILLISECOND : -1;
      if (m._pf._overflowDayOfYear && (overflow < YEAR || overflow > DATE)) {
        overflow = DATE;
      }
      m._pf.overflow = overflow;
    }
  }
  function isValid(m) {
    if (m._isValid == null) {
      m._isValid = !isNaN(m._d.getTime()) && m._pf.overflow < 0 && !m._pf.empty && !m._pf.invalidMonth && !m._pf.nullInput && !m._pf.invalidFormat && !m._pf.userInvalidated;
      if (m._strict) {
        m._isValid = m._isValid && m._pf.charsLeftOver === 0 && m._pf.unusedTokens.length === 0;
      }
    }
    return m._isValid;
  }
  function normalizeLanguage(key) {
    return key ? key.toLowerCase().replace('_', '-') : key;
  }
  function makeAs(input, model) {
    return model._isUTC ? moment(input).zone(model._offset || 0) : moment(input).local();
  }
  extend(Language.prototype, {
    set: function (config) {
      var prop, i;
      for (i in config) {
        prop = config[i];
        if (typeof prop === 'function') {
          this[i] = prop;
        } else {
          this['_' + i] = prop;
        }
      }
    },
    _months: 'January_February_March_April_May_June_July_August_September_October_November_December'.split('_'),
    months: function (m) {
      return this._months[m.month()];
    },
    _monthsShort: 'Jan_Feb_Mar_Apr_May_Jun_Jul_Aug_Sep_Oct_Nov_Dec'.split('_'),
    monthsShort: function (m) {
      return this._monthsShort[m.month()];
    },
    monthsParse: function (monthName) {
      var i, mom, regex;
      if (!this._monthsParse) {
        this._monthsParse = [];
      }
      for (i = 0; i < 12; i++) {
        if (!this._monthsParse[i]) {
          mom = moment.utc([
            2000,
            i
          ]);
          regex = '^' + this.months(mom, '') + '|^' + this.monthsShort(mom, '');
          this._monthsParse[i] = new RegExp(regex.replace('.', ''), 'i');
        }
        if (this._monthsParse[i].test(monthName)) {
          return i;
        }
      }
    },
    _weekdays: 'Sunday_Monday_Tuesday_Wednesday_Thursday_Friday_Saturday'.split('_'),
    weekdays: function (m) {
      return this._weekdays[m.day()];
    },
    _weekdaysShort: 'Sun_Mon_Tue_Wed_Thu_Fri_Sat'.split('_'),
    weekdaysShort: function (m) {
      return this._weekdaysShort[m.day()];
    },
    _weekdaysMin: 'Su_Mo_Tu_We_Th_Fr_Sa'.split('_'),
    weekdaysMin: function (m) {
      return this._weekdaysMin[m.day()];
    },
    weekdaysParse: function (weekdayName) {
      var i, mom, regex;
      if (!this._weekdaysParse) {
        this._weekdaysParse = [];
      }
      for (i = 0; i < 7; i++) {
        if (!this._weekdaysParse[i]) {
          mom = moment([
            2000,
            1
          ]).day(i);
          regex = '^' + this.weekdays(mom, '') + '|^' + this.weekdaysShort(mom, '') + '|^' + this.weekdaysMin(mom, '');
          this._weekdaysParse[i] = new RegExp(regex.replace('.', ''), 'i');
        }
        if (this._weekdaysParse[i].test(weekdayName)) {
          return i;
        }
      }
    },
    _longDateFormat: {
      LT: 'h:mm A',
      L: 'MM/DD/YYYY',
      LL: 'MMMM D YYYY',
      LLL: 'MMMM D YYYY LT',
      LLLL: 'dddd, MMMM D YYYY LT'
    },
    longDateFormat: function (key) {
      var output = this._longDateFormat[key];
      if (!output && this._longDateFormat[key.toUpperCase()]) {
        output = this._longDateFormat[key.toUpperCase()].replace(/MMMM|MM|DD|dddd/g, function (val) {
          return val.slice(1);
        });
        this._longDateFormat[key] = output;
      }
      return output;
    },
    isPM: function (input) {
      return (input + '').toLowerCase().charAt(0) === 'p';
    },
    _meridiemParse: /[ap]\.?m?\.?/i,
    meridiem: function (hours, minutes, isLower) {
      if (hours > 11) {
        return isLower ? 'pm' : 'PM';
      } else {
        return isLower ? 'am' : 'AM';
      }
    },
    _calendar: {
      sameDay: '[Today at] LT',
      nextDay: '[Tomorrow at] LT',
      nextWeek: 'dddd [at] LT',
      lastDay: '[Yesterday at] LT',
      lastWeek: '[Last] dddd [at] LT',
      sameElse: 'L'
    },
    calendar: function (key, mom) {
      var output = this._calendar[key];
      return typeof output === 'function' ? output.apply(mom) : output;
    },
    _relativeTime: {
      future: 'in %s',
      past: '%s ago',
      s: 'a few seconds',
      m: 'a minute',
      mm: '%d minutes',
      h: 'an hour',
      hh: '%d hours',
      d: 'a day',
      dd: '%d days',
      M: 'a month',
      MM: '%d months',
      y: 'a year',
      yy: '%d years'
    },
    relativeTime: function (number, withoutSuffix, string, isFuture) {
      var output = this._relativeTime[string];
      return typeof output === 'function' ? output(number, withoutSuffix, string, isFuture) : output.replace(/%d/i, number);
    },
    pastFuture: function (diff, output) {
      var format = this._relativeTime[diff > 0 ? 'future' : 'past'];
      return typeof format === 'function' ? format(output) : format.replace(/%s/i, output);
    },
    ordinal: function (number) {
      return this._ordinal.replace('%d', number);
    },
    _ordinal: '%d',
    preparse: function (string) {
      return string;
    },
    postformat: function (string) {
      return string;
    },
    week: function (mom) {
      return weekOfYear(mom, this._week.dow, this._week.doy).week;
    },
    _week: {
      dow: 0,
      doy: 6
    },
    _invalidDate: 'Invalid date',
    invalidDate: function () {
      return this._invalidDate;
    }
  });
  function loadLang(key, values) {
    values.abbr = key;
    if (!languages[key]) {
      languages[key] = new Language();
    }
    languages[key].set(values);
    return languages[key];
  }
  function unloadLang(key) {
    delete languages[key];
  }
  function getLangDefinition(key) {
    var i = 0, j, lang, next, split, get = function (k) {
        if (!languages[k] && hasModule) {
          try {
            require('./lang/' + k);
          } catch (e) {
          }
        }
        return languages[k];
      };
    if (!key) {
      return moment.fn._lang;
    }
    if (!isArray(key)) {
      lang = get(key);
      if (lang) {
        return lang;
      }
      key = [key];
    }
    while (i < key.length) {
      split = normalizeLanguage(key[i]).split('-');
      j = split.length;
      next = normalizeLanguage(key[i + 1]);
      next = next ? next.split('-') : null;
      while (j > 0) {
        lang = get(split.slice(0, j).join('-'));
        if (lang) {
          return lang;
        }
        if (next && next.length >= j && compareArrays(split, next, true) >= j - 1) {
          break;
        }
        j--;
      }
      i++;
    }
    return moment.fn._lang;
  }
  function removeFormattingTokens(input) {
    if (input.match(/\[[\s\S]/)) {
      return input.replace(/^\[|\]$/g, '');
    }
    return input.replace(/\\/g, '');
  }
  function makeFormatFunction(format) {
    var array = format.match(formattingTokens), i, length;
    for (i = 0, length = array.length; i < length; i++) {
      if (formatTokenFunctions[array[i]]) {
        array[i] = formatTokenFunctions[array[i]];
      } else {
        array[i] = removeFormattingTokens(array[i]);
      }
    }
    return function (mom) {
      var output = '';
      for (i = 0; i < length; i++) {
        output += array[i] instanceof Function ? array[i].call(mom, format) : array[i];
      }
      return output;
    };
  }
  function formatMoment(m, format) {
    if (!m.isValid()) {
      return m.lang().invalidDate();
    }
    format = expandFormat(format, m.lang());
    if (!formatFunctions[format]) {
      formatFunctions[format] = makeFormatFunction(format);
    }
    return formatFunctions[format](m);
  }
  function expandFormat(format, lang) {
    var i = 5;
    function replaceLongDateFormatTokens(input) {
      return lang.longDateFormat(input) || input;
    }
    localFormattingTokens.lastIndex = 0;
    while (i >= 0 && localFormattingTokens.test(format)) {
      format = format.replace(localFormattingTokens, replaceLongDateFormatTokens);
      localFormattingTokens.lastIndex = 0;
      i -= 1;
    }
    return format;
  }
  function getParseRegexForToken(token, config) {
    var a, strict = config._strict;
    switch (token) {
    case 'DDDD':
      return parseTokenThreeDigits;
    case 'YYYY':
    case 'GGGG':
    case 'gggg':
      return strict ? parseTokenFourDigits : parseTokenOneToFourDigits;
    case 'Y':
    case 'G':
    case 'g':
      return parseTokenSignedNumber;
    case 'YYYYYY':
    case 'YYYYY':
    case 'GGGGG':
    case 'ggggg':
      return strict ? parseTokenSixDigits : parseTokenOneToSixDigits;
    case 'S':
      if (strict) {
        return parseTokenOneDigit;
      }
    case 'SS':
      if (strict) {
        return parseTokenTwoDigits;
      }
    case 'SSS':
      if (strict) {
        return parseTokenThreeDigits;
      }
    case 'DDD':
      return parseTokenOneToThreeDigits;
    case 'MMM':
    case 'MMMM':
    case 'dd':
    case 'ddd':
    case 'dddd':
      return parseTokenWord;
    case 'a':
    case 'A':
      return getLangDefinition(config._l)._meridiemParse;
    case 'X':
      return parseTokenTimestampMs;
    case 'Z':
    case 'ZZ':
      return parseTokenTimezone;
    case 'T':
      return parseTokenT;
    case 'SSSS':
      return parseTokenDigits;
    case 'MM':
    case 'DD':
    case 'YY':
    case 'GG':
    case 'gg':
    case 'HH':
    case 'hh':
    case 'mm':
    case 'ss':
    case 'ww':
    case 'WW':
      return strict ? parseTokenTwoDigits : parseTokenOneOrTwoDigits;
    case 'M':
    case 'D':
    case 'd':
    case 'H':
    case 'h':
    case 'm':
    case 's':
    case 'w':
    case 'W':
    case 'e':
    case 'E':
      return parseTokenOneOrTwoDigits;
    default:
      a = new RegExp(regexpEscape(unescapeFormat(token.replace('\\', '')), 'i'));
      return a;
    }
  }
  function timezoneMinutesFromString(string) {
    string = string || '';
    var possibleTzMatches = string.match(parseTokenTimezone) || [], tzChunk = possibleTzMatches[possibleTzMatches.length - 1] || [], parts = (tzChunk + '').match(parseTimezoneChunker) || [
        '-',
        0,
        0
      ], minutes = +(parts[1] * 60) + toInt(parts[2]);
    return parts[0] === '+' ? -minutes : minutes;
  }
  function addTimeToArrayFromToken(token, input, config) {
    var a, datePartArray = config._a;
    switch (token) {
    case 'M':
    case 'MM':
      if (input != null) {
        datePartArray[MONTH] = toInt(input) - 1;
      }
      break;
    case 'MMM':
    case 'MMMM':
      a = getLangDefinition(config._l).monthsParse(input);
      if (a != null) {
        datePartArray[MONTH] = a;
      } else {
        config._pf.invalidMonth = input;
      }
      break;
    case 'D':
    case 'DD':
      if (input != null) {
        datePartArray[DATE] = toInt(input);
      }
      break;
    case 'DDD':
    case 'DDDD':
      if (input != null) {
        config._dayOfYear = toInt(input);
      }
      break;
    case 'YY':
      datePartArray[YEAR] = toInt(input) + (toInt(input) > 68 ? 1900 : 2000);
      break;
    case 'YYYY':
    case 'YYYYY':
    case 'YYYYYY':
      datePartArray[YEAR] = toInt(input);
      break;
    case 'a':
    case 'A':
      config._isPm = getLangDefinition(config._l).isPM(input);
      break;
    case 'H':
    case 'HH':
    case 'h':
    case 'hh':
      datePartArray[HOUR] = toInt(input);
      break;
    case 'm':
    case 'mm':
      datePartArray[MINUTE] = toInt(input);
      break;
    case 's':
    case 'ss':
      datePartArray[SECOND] = toInt(input);
      break;
    case 'S':
    case 'SS':
    case 'SSS':
    case 'SSSS':
      datePartArray[MILLISECOND] = toInt(('0.' + input) * 1000);
      break;
    case 'X':
      config._d = new Date(parseFloat(input) * 1000);
      break;
    case 'Z':
    case 'ZZ':
      config._useUTC = true;
      config._tzm = timezoneMinutesFromString(input);
      break;
    case 'w':
    case 'ww':
    case 'W':
    case 'WW':
    case 'd':
    case 'dd':
    case 'ddd':
    case 'dddd':
    case 'e':
    case 'E':
      token = token.substr(0, 1);
    case 'gg':
    case 'gggg':
    case 'GG':
    case 'GGGG':
    case 'GGGGG':
      token = token.substr(0, 2);
      if (input) {
        config._w = config._w || {};
        config._w[token] = input;
      }
      break;
    }
  }
  function dateFromConfig(config) {
    var i, date, input = [], currentDate, yearToUse, fixYear, w, temp, lang, weekday, week;
    if (config._d) {
      return;
    }
    currentDate = currentDateArray(config);
    if (config._w && config._a[DATE] == null && config._a[MONTH] == null) {
      fixYear = function (val) {
        var int_val = parseInt(val, 10);
        return val ? val.length < 3 ? int_val > 68 ? 1900 + int_val : 2000 + int_val : int_val : config._a[YEAR] == null ? moment().weekYear() : config._a[YEAR];
      };
      w = config._w;
      if (w.GG != null || w.W != null || w.E != null) {
        temp = dayOfYearFromWeeks(fixYear(w.GG), w.W || 1, w.E, 4, 1);
      } else {
        lang = getLangDefinition(config._l);
        weekday = w.d != null ? parseWeekday(w.d, lang) : w.e != null ? parseInt(w.e, 10) + lang._week.dow : 0;
        week = parseInt(w.w, 10) || 1;
        if (w.d != null && weekday < lang._week.dow) {
          week++;
        }
        temp = dayOfYearFromWeeks(fixYear(w.gg), week, weekday, lang._week.doy, lang._week.dow);
      }
      config._a[YEAR] = temp.year;
      config._dayOfYear = temp.dayOfYear;
    }
    if (config._dayOfYear) {
      yearToUse = config._a[YEAR] == null ? currentDate[YEAR] : config._a[YEAR];
      if (config._dayOfYear > daysInYear(yearToUse)) {
        config._pf._overflowDayOfYear = true;
      }
      date = makeUTCDate(yearToUse, 0, config._dayOfYear);
      config._a[MONTH] = date.getUTCMonth();
      config._a[DATE] = date.getUTCDate();
    }
    for (i = 0; i < 3 && config._a[i] == null; ++i) {
      config._a[i] = input[i] = currentDate[i];
    }
    for (; i < 7; i++) {
      config._a[i] = input[i] = config._a[i] == null ? i === 2 ? 1 : 0 : config._a[i];
    }
    input[HOUR] += toInt((config._tzm || 0) / 60);
    input[MINUTE] += toInt((config._tzm || 0) % 60);
    config._d = (config._useUTC ? makeUTCDate : makeDate).apply(null, input);
  }
  function dateFromObject(config) {
    var normalizedInput;
    if (config._d) {
      return;
    }
    normalizedInput = normalizeObjectUnits(config._i);
    config._a = [
      normalizedInput.year,
      normalizedInput.month,
      normalizedInput.day,
      normalizedInput.hour,
      normalizedInput.minute,
      normalizedInput.second,
      normalizedInput.millisecond
    ];
    dateFromConfig(config);
  }
  function currentDateArray(config) {
    var now = new Date();
    if (config._useUTC) {
      return [
        now.getUTCFullYear(),
        now.getUTCMonth(),
        now.getUTCDate()
      ];
    } else {
      return [
        now.getFullYear(),
        now.getMonth(),
        now.getDate()
      ];
    }
  }
  function makeDateFromStringAndFormat(config) {
    config._a = [];
    config._pf.empty = true;
    var lang = getLangDefinition(config._l), string = '' + config._i, i, parsedInput, tokens, token, skipped, stringLength = string.length, totalParsedInputLength = 0;
    tokens = expandFormat(config._f, lang).match(formattingTokens) || [];
    for (i = 0; i < tokens.length; i++) {
      token = tokens[i];
      parsedInput = (string.match(getParseRegexForToken(token, config)) || [])[0];
      if (parsedInput) {
        skipped = string.substr(0, string.indexOf(parsedInput));
        if (skipped.length > 0) {
          config._pf.unusedInput.push(skipped);
        }
        string = string.slice(string.indexOf(parsedInput) + parsedInput.length);
        totalParsedInputLength += parsedInput.length;
      }
      if (formatTokenFunctions[token]) {
        if (parsedInput) {
          config._pf.empty = false;
        } else {
          config._pf.unusedTokens.push(token);
        }
        addTimeToArrayFromToken(token, parsedInput, config);
      } else if (config._strict && !parsedInput) {
        config._pf.unusedTokens.push(token);
      }
    }
    config._pf.charsLeftOver = stringLength - totalParsedInputLength;
    if (string.length > 0) {
      config._pf.unusedInput.push(string);
    }
    if (config._isPm && config._a[HOUR] < 12) {
      config._a[HOUR] += 12;
    }
    if (config._isPm === false && config._a[HOUR] === 12) {
      config._a[HOUR] = 0;
    }
    dateFromConfig(config);
    checkOverflow(config);
  }
  function unescapeFormat(s) {
    return s.replace(/\\(\[)|\\(\])|\[([^\]\[]*)\]|\\(.)/g, function (matched, p1, p2, p3, p4) {
      return p1 || p2 || p3 || p4;
    });
  }
  function regexpEscape(s) {
    return s.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
  }
  function makeDateFromStringAndArray(config) {
    var tempConfig, bestMoment, scoreToBeat, i, currentScore;
    if (config._f.length === 0) {
      config._pf.invalidFormat = true;
      config._d = new Date(NaN);
      return;
    }
    for (i = 0; i < config._f.length; i++) {
      currentScore = 0;
      tempConfig = extend({}, config);
      tempConfig._pf = defaultParsingFlags();
      tempConfig._f = config._f[i];
      makeDateFromStringAndFormat(tempConfig);
      if (!isValid(tempConfig)) {
        continue;
      }
      currentScore += tempConfig._pf.charsLeftOver;
      currentScore += tempConfig._pf.unusedTokens.length * 10;
      tempConfig._pf.score = currentScore;
      if (scoreToBeat == null || currentScore < scoreToBeat) {
        scoreToBeat = currentScore;
        bestMoment = tempConfig;
      }
    }
    extend(config, bestMoment || tempConfig);
  }
  function makeDateFromString(config) {
    var i, l, string = config._i, match = isoRegex.exec(string);
    if (match) {
      config._pf.iso = true;
      for (i = 0, l = isoDates.length; i < l; i++) {
        if (isoDates[i][1].exec(string)) {
          config._f = isoDates[i][0] + (match[6] || ' ');
          break;
        }
      }
      for (i = 0, l = isoTimes.length; i < l; i++) {
        if (isoTimes[i][1].exec(string)) {
          config._f += isoTimes[i][0];
          break;
        }
      }
      if (string.match(parseTokenTimezone)) {
        config._f += 'Z';
      }
      makeDateFromStringAndFormat(config);
    } else {
      config._d = new Date(string);
    }
  }
  function makeDateFromInput(config) {
    var input = config._i, matched = aspNetJsonRegex.exec(input);
    if (input === undefined) {
      config._d = new Date();
    } else if (matched) {
      config._d = new Date(+matched[1]);
    } else if (typeof input === 'string') {
      makeDateFromString(config);
    } else if (isArray(input)) {
      config._a = input.slice(0);
      dateFromConfig(config);
    } else if (isDate(input)) {
      config._d = new Date(+input);
    } else if (typeof input === 'object') {
      dateFromObject(config);
    } else {
      config._d = new Date(input);
    }
  }
  function makeDate(y, m, d, h, M, s, ms) {
    var date = new Date(y, m, d, h, M, s, ms);
    if (y < 1970) {
      date.setFullYear(y);
    }
    return date;
  }
  function makeUTCDate(y) {
    var date = new Date(Date.UTC.apply(null, arguments));
    if (y < 1970) {
      date.setUTCFullYear(y);
    }
    return date;
  }
  function parseWeekday(input, language) {
    if (typeof input === 'string') {
      if (!isNaN(input)) {
        input = parseInt(input, 10);
      } else {
        input = language.weekdaysParse(input);
        if (typeof input !== 'number') {
          return null;
        }
      }
    }
    return input;
  }
  function substituteTimeAgo(string, number, withoutSuffix, isFuture, lang) {
    return lang.relativeTime(number || 1, !!withoutSuffix, string, isFuture);
  }
  function relativeTime(milliseconds, withoutSuffix, lang) {
    var seconds = round(Math.abs(milliseconds) / 1000), minutes = round(seconds / 60), hours = round(minutes / 60), days = round(hours / 24), years = round(days / 365), args = seconds < 45 && [
        's',
        seconds
      ] || minutes === 1 && ['m'] || minutes < 45 && [
        'mm',
        minutes
      ] || hours === 1 && ['h'] || hours < 22 && [
        'hh',
        hours
      ] || days === 1 && ['d'] || days <= 25 && [
        'dd',
        days
      ] || days <= 45 && ['M'] || days < 345 && [
        'MM',
        round(days / 30)
      ] || years === 1 && ['y'] || [
        'yy',
        years
      ];
    args[2] = withoutSuffix;
    args[3] = milliseconds > 0;
    args[4] = lang;
    return substituteTimeAgo.apply({}, args);
  }
  function weekOfYear(mom, firstDayOfWeek, firstDayOfWeekOfYear) {
    var end = firstDayOfWeekOfYear - firstDayOfWeek, daysToDayOfWeek = firstDayOfWeekOfYear - mom.day(), adjustedMoment;
    if (daysToDayOfWeek > end) {
      daysToDayOfWeek -= 7;
    }
    if (daysToDayOfWeek < end - 7) {
      daysToDayOfWeek += 7;
    }
    adjustedMoment = moment(mom).add('d', daysToDayOfWeek);
    return {
      week: Math.ceil(adjustedMoment.dayOfYear() / 7),
      year: adjustedMoment.year()
    };
  }
  function dayOfYearFromWeeks(year, week, weekday, firstDayOfWeekOfYear, firstDayOfWeek) {
    var d = makeUTCDate(year, 0, 1).getUTCDay(), daysToAdd, dayOfYear;
    weekday = weekday != null ? weekday : firstDayOfWeek;
    daysToAdd = firstDayOfWeek - d + (d > firstDayOfWeekOfYear ? 7 : 0) - (d < firstDayOfWeek ? 7 : 0);
    dayOfYear = 7 * (week - 1) + (weekday - firstDayOfWeek) + daysToAdd + 1;
    return {
      year: dayOfYear > 0 ? year : year - 1,
      dayOfYear: dayOfYear > 0 ? dayOfYear : daysInYear(year - 1) + dayOfYear
    };
  }
  function makeMoment(config) {
    var input = config._i, format = config._f;
    if (input === null) {
      return moment.invalid({ nullInput: true });
    }
    if (typeof input === 'string') {
      config._i = input = getLangDefinition().preparse(input);
    }
    if (moment.isMoment(input)) {
      config = cloneMoment(input);
      config._d = new Date(+input._d);
    } else if (format) {
      if (isArray(format)) {
        makeDateFromStringAndArray(config);
      } else {
        makeDateFromStringAndFormat(config);
      }
    } else {
      makeDateFromInput(config);
    }
    return new Moment(config);
  }
  moment = function (input, format, lang, strict) {
    var c;
    if (typeof lang === 'boolean') {
      strict = lang;
      lang = undefined;
    }
    c = {};
    c._isAMomentObject = true;
    c._i = input;
    c._f = format;
    c._l = lang;
    c._strict = strict;
    c._isUTC = false;
    c._pf = defaultParsingFlags();
    return makeMoment(c);
  };
  moment.utc = function (input, format, lang, strict) {
    var c;
    if (typeof lang === 'boolean') {
      strict = lang;
      lang = undefined;
    }
    c = {};
    c._isAMomentObject = true;
    c._useUTC = true;
    c._isUTC = true;
    c._l = lang;
    c._i = input;
    c._f = format;
    c._strict = strict;
    c._pf = defaultParsingFlags();
    return makeMoment(c).utc();
  };
  moment.unix = function (input) {
    return moment(input * 1000);
  };
  moment.duration = function (input, key) {
    var duration = input, match = null, sign, ret, parseIso;
    if (moment.isDuration(input)) {
      duration = {
        ms: input._milliseconds,
        d: input._days,
        M: input._months
      };
    } else if (typeof input === 'number') {
      duration = {};
      if (key) {
        duration[key] = input;
      } else {
        duration.milliseconds = input;
      }
    } else if (!!(match = aspNetTimeSpanJsonRegex.exec(input))) {
      sign = match[1] === '-' ? -1 : 1;
      duration = {
        y: 0,
        d: toInt(match[DATE]) * sign,
        h: toInt(match[HOUR]) * sign,
        m: toInt(match[MINUTE]) * sign,
        s: toInt(match[SECOND]) * sign,
        ms: toInt(match[MILLISECOND]) * sign
      };
    } else if (!!(match = isoDurationRegex.exec(input))) {
      sign = match[1] === '-' ? -1 : 1;
      parseIso = function (inp) {
        var res = inp && parseFloat(inp.replace(',', '.'));
        return (isNaN(res) ? 0 : res) * sign;
      };
      duration = {
        y: parseIso(match[2]),
        M: parseIso(match[3]),
        d: parseIso(match[4]),
        h: parseIso(match[5]),
        m: parseIso(match[6]),
        s: parseIso(match[7]),
        w: parseIso(match[8])
      };
    }
    ret = new Duration(duration);
    if (moment.isDuration(input) && input.hasOwnProperty('_lang')) {
      ret._lang = input._lang;
    }
    return ret;
  };
  moment.version = VERSION;
  moment.defaultFormat = isoFormat;
  moment.updateOffset = function () {
  };
  moment.lang = function (key, values) {
    var r;
    if (!key) {
      return moment.fn._lang._abbr;
    }
    if (values) {
      loadLang(normalizeLanguage(key), values);
    } else if (values === null) {
      unloadLang(key);
      key = 'en';
    } else if (!languages[key]) {
      getLangDefinition(key);
    }
    r = moment.duration.fn._lang = moment.fn._lang = getLangDefinition(key);
    return r._abbr;
  };
  moment.langData = function (key) {
    if (key && key._lang && key._lang._abbr) {
      key = key._lang._abbr;
    }
    return getLangDefinition(key);
  };
  moment.isMoment = function (obj) {
    return obj instanceof Moment || obj != null && obj.hasOwnProperty('_isAMomentObject');
  };
  moment.isDuration = function (obj) {
    return obj instanceof Duration;
  };
  for (i = lists.length - 1; i >= 0; --i) {
    makeList(lists[i]);
  }
  moment.normalizeUnits = function (units) {
    return normalizeUnits(units);
  };
  moment.invalid = function (flags) {
    var m = moment.utc(NaN);
    if (flags != null) {
      extend(m._pf, flags);
    } else {
      m._pf.userInvalidated = true;
    }
    return m;
  };
  moment.parseZone = function (input) {
    return moment(input).parseZone();
  };
  extend(moment.fn = Moment.prototype, {
    clone: function () {
      return moment(this);
    },
    valueOf: function () {
      return +this._d + (this._offset || 0) * 60000;
    },
    unix: function () {
      return Math.floor(+this / 1000);
    },
    toString: function () {
      return this.clone().lang('en').format('ddd MMM DD YYYY HH:mm:ss [GMT]ZZ');
    },
    toDate: function () {
      return this._offset ? new Date(+this) : this._d;
    },
    toISOString: function () {
      var m = moment(this).utc();
      if (0 < m.year() && m.year() <= 9999) {
        return formatMoment(m, 'YYYY-MM-DD[T]HH:mm:ss.SSS[Z]');
      } else {
        return formatMoment(m, 'YYYYYY-MM-DD[T]HH:mm:ss.SSS[Z]');
      }
    },
    toArray: function () {
      var m = this;
      return [
        m.year(),
        m.month(),
        m.date(),
        m.hours(),
        m.minutes(),
        m.seconds(),
        m.milliseconds()
      ];
    },
    isValid: function () {
      return isValid(this);
    },
    isDSTShifted: function () {
      if (this._a) {
        return this.isValid() && compareArrays(this._a, (this._isUTC ? moment.utc(this._a) : moment(this._a)).toArray()) > 0;
      }
      return false;
    },
    parsingFlags: function () {
      return extend({}, this._pf);
    },
    invalidAt: function () {
      return this._pf.overflow;
    },
    utc: function () {
      return this.zone(0);
    },
    local: function () {
      this.zone(0);
      this._isUTC = false;
      return this;
    },
    format: function (inputString) {
      var output = formatMoment(this, inputString || moment.defaultFormat);
      return this.lang().postformat(output);
    },
    add: function (input, val) {
      var dur;
      if (typeof input === 'string') {
        dur = moment.duration(+val, input);
      } else {
        dur = moment.duration(input, val);
      }
      addOrSubtractDurationFromMoment(this, dur, 1);
      return this;
    },
    subtract: function (input, val) {
      var dur;
      if (typeof input === 'string') {
        dur = moment.duration(+val, input);
      } else {
        dur = moment.duration(input, val);
      }
      addOrSubtractDurationFromMoment(this, dur, -1);
      return this;
    },
    diff: function (input, units, asFloat) {
      var that = makeAs(input, this), zoneDiff = (this.zone() - that.zone()) * 60000, diff, output;
      units = normalizeUnits(units);
      if (units === 'year' || units === 'month') {
        diff = (this.daysInMonth() + that.daysInMonth()) * 43200000;
        output = (this.year() - that.year()) * 12 + (this.month() - that.month());
        output += (this - moment(this).startOf('month') - (that - moment(that).startOf('month'))) / diff;
        output -= (this.zone() - moment(this).startOf('month').zone() - (that.zone() - moment(that).startOf('month').zone())) * 60000 / diff;
        if (units === 'year') {
          output = output / 12;
        }
      } else {
        diff = this - that;
        output = units === 'second' ? diff / 1000 : units === 'minute' ? diff / 60000 : units === 'hour' ? diff / 3600000 : units === 'day' ? (diff - zoneDiff) / 86400000 : units === 'week' ? (diff - zoneDiff) / 604800000 : diff;
      }
      return asFloat ? output : absRound(output);
    },
    from: function (time, withoutSuffix) {
      return moment.duration(this.diff(time)).lang(this.lang()._abbr).humanize(!withoutSuffix);
    },
    fromNow: function (withoutSuffix) {
      return this.from(moment(), withoutSuffix);
    },
    calendar: function () {
      var sod = makeAs(moment(), this).startOf('day'), diff = this.diff(sod, 'days', true), format = diff < -6 ? 'sameElse' : diff < -1 ? 'lastWeek' : diff < 0 ? 'lastDay' : diff < 1 ? 'sameDay' : diff < 2 ? 'nextDay' : diff < 7 ? 'nextWeek' : 'sameElse';
      return this.format(this.lang().calendar(format, this));
    },
    isLeapYear: function () {
      return isLeapYear(this.year());
    },
    isDST: function () {
      return this.zone() < this.clone().month(0).zone() || this.zone() < this.clone().month(5).zone();
    },
    day: function (input) {
      var day = this._isUTC ? this._d.getUTCDay() : this._d.getDay();
      if (input != null) {
        input = parseWeekday(input, this.lang());
        return this.add({ d: input - day });
      } else {
        return day;
      }
    },
    month: function (input) {
      var utc = this._isUTC ? 'UTC' : '', dayOfMonth;
      if (input != null) {
        if (typeof input === 'string') {
          input = this.lang().monthsParse(input);
          if (typeof input !== 'number') {
            return this;
          }
        }
        dayOfMonth = this.date();
        this.date(1);
        this._d['set' + utc + 'Month'](input);
        this.date(Math.min(dayOfMonth, this.daysInMonth()));
        moment.updateOffset(this);
        return this;
      } else {
        return this._d['get' + utc + 'Month']();
      }
    },
    startOf: function (units) {
      units = normalizeUnits(units);
      switch (units) {
      case 'year':
        this.month(0);
      case 'month':
        this.date(1);
      case 'week':
      case 'isoWeek':
      case 'day':
        this.hours(0);
      case 'hour':
        this.minutes(0);
      case 'minute':
        this.seconds(0);
      case 'second':
        this.milliseconds(0);
      }
      if (units === 'week') {
        this.weekday(0);
      } else if (units === 'isoWeek') {
        this.isoWeekday(1);
      }
      return this;
    },
    endOf: function (units) {
      units = normalizeUnits(units);
      return this.startOf(units).add(units === 'isoWeek' ? 'week' : units, 1).subtract('ms', 1);
    },
    isAfter: function (input, units) {
      units = typeof units !== 'undefined' ? units : 'millisecond';
      return +this.clone().startOf(units) > +moment(input).startOf(units);
    },
    isBefore: function (input, units) {
      units = typeof units !== 'undefined' ? units : 'millisecond';
      return +this.clone().startOf(units) < +moment(input).startOf(units);
    },
    isSame: function (input, units) {
      units = units || 'ms';
      return +this.clone().startOf(units) === +makeAs(input, this).startOf(units);
    },
    min: function (other) {
      other = moment.apply(null, arguments);
      return other < this ? this : other;
    },
    max: function (other) {
      other = moment.apply(null, arguments);
      return other > this ? this : other;
    },
    zone: function (input) {
      var offset = this._offset || 0;
      if (input != null) {
        if (typeof input === 'string') {
          input = timezoneMinutesFromString(input);
        }
        if (Math.abs(input) < 16) {
          input = input * 60;
        }
        this._offset = input;
        this._isUTC = true;
        if (offset !== input) {
          addOrSubtractDurationFromMoment(this, moment.duration(offset - input, 'm'), 1, true);
        }
      } else {
        return this._isUTC ? offset : this._d.getTimezoneOffset();
      }
      return this;
    },
    zoneAbbr: function () {
      return this._isUTC ? 'UTC' : '';
    },
    zoneName: function () {
      return this._isUTC ? 'Coordinated Universal Time' : '';
    },
    parseZone: function () {
      if (this._tzm) {
        this.zone(this._tzm);
      } else if (typeof this._i === 'string') {
        this.zone(this._i);
      }
      return this;
    },
    hasAlignedHourOffset: function (input) {
      if (!input) {
        input = 0;
      } else {
        input = moment(input).zone();
      }
      return (this.zone() - input) % 60 === 0;
    },
    daysInMonth: function () {
      return daysInMonth(this.year(), this.month());
    },
    dayOfYear: function (input) {
      var dayOfYear = round((moment(this).startOf('day') - moment(this).startOf('year')) / 86400000) + 1;
      return input == null ? dayOfYear : this.add('d', input - dayOfYear);
    },
    quarter: function () {
      return Math.ceil((this.month() + 1) / 3);
    },
    weekYear: function (input) {
      var year = weekOfYear(this, this.lang()._week.dow, this.lang()._week.doy).year;
      return input == null ? year : this.add('y', input - year);
    },
    isoWeekYear: function (input) {
      var year = weekOfYear(this, 1, 4).year;
      return input == null ? year : this.add('y', input - year);
    },
    week: function (input) {
      var week = this.lang().week(this);
      return input == null ? week : this.add('d', (input - week) * 7);
    },
    isoWeek: function (input) {
      var week = weekOfYear(this, 1, 4).week;
      return input == null ? week : this.add('d', (input - week) * 7);
    },
    weekday: function (input) {
      var weekday = (this.day() + 7 - this.lang()._week.dow) % 7;
      return input == null ? weekday : this.add('d', input - weekday);
    },
    isoWeekday: function (input) {
      return input == null ? this.day() || 7 : this.day(this.day() % 7 ? input : input - 7);
    },
    get: function (units) {
      units = normalizeUnits(units);
      return this[units]();
    },
    set: function (units, value) {
      units = normalizeUnits(units);
      if (typeof this[units] === 'function') {
        this[units](value);
      }
      return this;
    },
    lang: function (key) {
      if (key === undefined) {
        return this._lang;
      } else {
        this._lang = getLangDefinition(key);
        return this;
      }
    }
  });
  function makeGetterAndSetter(name, key) {
    moment.fn[name] = moment.fn[name + 's'] = function (input) {
      var utc = this._isUTC ? 'UTC' : '';
      if (input != null) {
        this._d['set' + utc + key](input);
        moment.updateOffset(this);
        return this;
      } else {
        return this._d['get' + utc + key]();
      }
    };
  }
  for (i = 0; i < proxyGettersAndSetters.length; i++) {
    makeGetterAndSetter(proxyGettersAndSetters[i].toLowerCase().replace(/s$/, ''), proxyGettersAndSetters[i]);
  }
  makeGetterAndSetter('year', 'FullYear');
  moment.fn.days = moment.fn.day;
  moment.fn.months = moment.fn.month;
  moment.fn.weeks = moment.fn.week;
  moment.fn.isoWeeks = moment.fn.isoWeek;
  moment.fn.toJSON = moment.fn.toISOString;
  extend(moment.duration.fn = Duration.prototype, {
    _bubble: function () {
      var milliseconds = this._milliseconds, days = this._days, months = this._months, data = this._data, seconds, minutes, hours, years;
      data.milliseconds = milliseconds % 1000;
      seconds = absRound(milliseconds / 1000);
      data.seconds = seconds % 60;
      minutes = absRound(seconds / 60);
      data.minutes = minutes % 60;
      hours = absRound(minutes / 60);
      data.hours = hours % 24;
      days += absRound(hours / 24);
      data.days = days % 30;
      months += absRound(days / 30);
      data.months = months % 12;
      years = absRound(months / 12);
      data.years = years;
    },
    weeks: function () {
      return absRound(this.days() / 7);
    },
    valueOf: function () {
      return this._milliseconds + this._days * 86400000 + this._months % 12 * 2592000000 + toInt(this._months / 12) * 31536000000;
    },
    humanize: function (withSuffix) {
      var difference = +this, output = relativeTime(difference, !withSuffix, this.lang());
      if (withSuffix) {
        output = this.lang().pastFuture(difference, output);
      }
      return this.lang().postformat(output);
    },
    add: function (input, val) {
      var dur = moment.duration(input, val);
      this._milliseconds += dur._milliseconds;
      this._days += dur._days;
      this._months += dur._months;
      this._bubble();
      return this;
    },
    subtract: function (input, val) {
      var dur = moment.duration(input, val);
      this._milliseconds -= dur._milliseconds;
      this._days -= dur._days;
      this._months -= dur._months;
      this._bubble();
      return this;
    },
    get: function (units) {
      units = normalizeUnits(units);
      return this[units.toLowerCase() + 's']();
    },
    as: function (units) {
      units = normalizeUnits(units);
      return this['as' + units.charAt(0).toUpperCase() + units.slice(1) + 's']();
    },
    lang: moment.fn.lang,
    toIsoString: function () {
      var years = Math.abs(this.years()), months = Math.abs(this.months()), days = Math.abs(this.days()), hours = Math.abs(this.hours()), minutes = Math.abs(this.minutes()), seconds = Math.abs(this.seconds() + this.milliseconds() / 1000);
      if (!this.asSeconds()) {
        return 'P0D';
      }
      return (this.asSeconds() < 0 ? '-' : '') + 'P' + (years ? years + 'Y' : '') + (months ? months + 'M' : '') + (days ? days + 'D' : '') + (hours || minutes || seconds ? 'T' : '') + (hours ? hours + 'H' : '') + (minutes ? minutes + 'M' : '') + (seconds ? seconds + 'S' : '');
    }
  });
  function makeDurationGetter(name) {
    moment.duration.fn[name] = function () {
      return this._data[name];
    };
  }
  function makeDurationAsGetter(name, factor) {
    moment.duration.fn['as' + name] = function () {
      return +this / factor;
    };
  }
  for (i in unitMillisecondFactors) {
    if (unitMillisecondFactors.hasOwnProperty(i)) {
      makeDurationAsGetter(i, unitMillisecondFactors[i]);
      makeDurationGetter(i.toLowerCase());
    }
  }
  makeDurationAsGetter('Weeks', 604800000);
  moment.duration.fn.asMonths = function () {
    return (+this - this.years() * 31536000000) / 2592000000 + this.years() * 12;
  };
  moment.lang('en', {
    ordinal: function (number) {
      var b = number % 10, output = toInt(number % 100 / 10) === 1 ? 'th' : b === 1 ? 'st' : b === 2 ? 'nd' : b === 3 ? 'rd' : 'th';
      return number + output;
    }
  });
  function makeGlobal(deprecate) {
    var warned = false, local_moment = moment;
    if (typeof ender !== 'undefined') {
      return;
    }
    if (deprecate) {
      global.moment = function () {
        if (!warned && console && console.warn) {
          warned = true;
          console.warn('Accessing Moment through the global scope is ' + 'deprecated, and will be removed in an upcoming ' + 'release.');
        }
        return local_moment.apply(null, arguments);
      };
      extend(global.moment, local_moment);
    } else {
      global['moment'] = moment;
    }
  }
  if (hasModule) {
    module.exports = moment;
    makeGlobal(true);
  } else if (typeof define === 'function' && define.amd) {
    define('moment', [
      'require',
      'exports',
      'module'
    ], function (require, exports, module) {
      if (module.config && module.config() && module.config().noGlobal !== true) {
        makeGlobal(module.config().noGlobal === undefined);
      }
      return moment;
    });
  } else {
    makeGlobal();
  }
}.call(this));
(function () {
  function applyTimezone(aMoment, timezone, $log) {
    if (aMoment && timezone) {
      if (aMoment.tz) {
        aMoment = aMoment.tz(timezone);
      } else {
        $log.warn('angular-moment: timezone specified but moment.tz() is undefined. Did you forget to include moment-timezone.js?');
      }
    }
    return aMoment;
  }
  angular.module('angularMoment', []).constant('angularMomentConfig', { timezone: '' }).constant('amTimeAgoConfig', { withoutSuffix: false }).directive('amTimeAgo', [
    '$window',
    'amTimeAgoConfig',
    function ($window, amTimeAgoConfig) {
      return function (scope, element, attr) {
        var activeTimeout = null;
        var currentValue;
        var currentFormat;
        var withoutSuffix = amTimeAgoConfig.withoutSuffix;
        function cancelTimer() {
          if (activeTimeout) {
            $window.clearTimeout(activeTimeout);
            activeTimeout = null;
          }
        }
        function updateTime(momentInstance) {
          element.text(momentInstance.fromNow(withoutSuffix));
          var howOld = $window.moment().diff(momentInstance, 'minute');
          var secondsUntilUpdate = 3600;
          if (howOld < 1) {
            secondsUntilUpdate = 1;
          } else if (howOld < 60) {
            secondsUntilUpdate = 30;
          } else if (howOld < 180) {
            secondsUntilUpdate = 300;
          }
          activeTimeout = $window.setTimeout(function () {
            updateTime(momentInstance);
          }, secondsUntilUpdate * 1000);
        }
        function updateMoment() {
          cancelTimer();
          updateTime($window.moment(currentValue, currentFormat));
        }
        scope.$watch(attr.amTimeAgo, function (value) {
          if (typeof value === 'undefined' || value === null || value === '') {
            cancelTimer();
            if (currentValue) {
              element.text('');
              currentValue = null;
            }
            return;
          }
          if (angular.isNumber(value)) {
            value = new Date(value);
          }
          currentValue = value;
          updateMoment();
        });
        if (angular.isDefined(attr.amWithoutSuffix)) {
          scope.$watch(attr.amWithoutSuffix, function (value) {
            if (typeof value === 'boolean') {
              withoutSuffix = value;
              updateMoment();
            } else {
              withoutSuffix = amTimeAgoConfig.withoutSuffix;
            }
          });
        }
        attr.$observe('amFormat', function (format) {
          currentFormat = format;
          if (currentValue) {
            updateMoment();
          }
        });
        scope.$on('$destroy', function () {
          cancelTimer();
        });
      };
    }
  ]).filter('amCalendar', [
    '$window',
    '$log',
    'angularMomentConfig',
    function ($window, $log, angularMomentConfig) {
      return function (value) {
        if (typeof value === 'undefined' || value === null) {
          return '';
        }
        if (!isNaN(parseFloat(value)) && isFinite(value)) {
          value = new Date(parseInt(value, 10));
        }
        return applyTimezone($window.moment(value), angularMomentConfig.timezone, $log).calendar();
      };
    }
  ]).filter('amDateFormat', [
    '$window',
    '$log',
    'angularMomentConfig',
    function ($window, $log, angularMomentConfig) {
      return function (value, format) {
        if (typeof value === 'undefined' || value === null) {
          return '';
        }
        if (!isNaN(parseFloat(value)) && isFinite(value)) {
          value = new Date(parseInt(value, 10));
        }
        return applyTimezone($window.moment(value), angularMomentConfig.timezone, $log).format(format);
      };
    }
  ]).filter('amDurationFormat', [
    '$window',
    function ($window) {
      return function (value, format, suffix) {
        if (typeof value === 'undefined' || value === null) {
          return '';
        }
        return $window.moment.duration(value, format).humanize(suffix);
      };
    }
  ]);
}());
define('angular-moment', function () {
});
define('directives/Media', [
  'constants',
  'services/Authentication',
  'services/ParanoidScope',
  'services/ImageManager',
  'filters/NotThumbnail',
  'moment',
  'angular-moment'
], function (constants) {
  var MediaModule = angular.module('commissar.directives.Media', [
      'commissar.services.Authentication',
      'commissar.services.ParanoidScope',
      'commissar.services.ImageManager',
      'commissar.filters.NotThumbnail',
      'angularMoment'
    ]);
  MediaModule.controller('commissar.directives.Media.controller', [
    '$scope',
    'NotThumbnailFilter',
    '$element',
    'ParanoidScope',
    'ImageManager',
    function ($scope, NotThumbnailFilter, $element, ParanoidScope, ImageManager) {
      $scope.controllerName = 'commissar.directives.Media.controller';
      $scope.name = $scope.document.title;
      $scope.editableDocument = angular.copy($scope.document);
      $scope.className = function () {
        var mediaType = $scope.document.mediaType;
        if (constants.allowedMediaTypes.indexOf(mediaType) < 0) {
          mediaType = '';
        }
        var mode = $scope.mode();
        return 'mmedia mmedia-' + mediaType + ' mmedia-' + mode + ' mmedia-' + mode + '-' + mediaType;
      };
      $scope.thumbnail = function (type) {
        var possibles = [];
        angular.forEach(NotThumbnailFilter($scope.document._attachments), function (value, key) {
          possibles.push(key);
        });
        return '/node/thumbnail/' + type + '/commissar_user_' + $scope.document.author + '/' + $scope.document._id + '/' + possibles[0];
      };
      $scope.isOpened = function () {
        return $scope.mediaOpened($scope.name);
      };
      $scope.open = function () {
        console.log('open', $scope.name);
        if (!$scope.isOpened()) {
          $scope.mediaOpened($scope.name, true);
        }
      };
      $scope.close = function () {
        console.log('close');
        if ($scope.isOpened()) {
          $scope.mediaOpened($scope.name, false);
        }
      };
      $scope.mode = function () {
        return $scope.parentMode;
      };
      $scope.isMode = function (input) {
        return $scope.mode === input;
      };
      $scope.edit = function () {
        ParanoidScope.apply($scope, function () {
          $scope.editing = true;
        });
      };
      $scope.save = function () {
        ParanoidScope.apply($scope, function () {
          ImageManager.save($scope.editableDocument).then(function () {
            $scope.editing = false;
            $scope.open($scope.editableDocument.title, true);
          }, function (err) {
            alert('Couldn\'t save! ' + err);
          });
        });
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
        require: 'document',
        scope: {
          document: '=',
          visible: '=',
          parentMode: '@mode',
          mediaOpened: '='
        },
        controller: 'commissar.directives.Media.controller'
      };
    return Media;
  });
  return MediaModule;
});
define('directives/MediaGroup', [
  'constants',
  'services/ParanoidScope',
  'directives/Media'
], function (constants) {
  var MediaGroupModule = angular.module('commissar.directives.MediaGroup', [
      'commissar.directives.Media',
      'commissar.services.ParanoidScope'
    ]);
  MediaGroupModule.controller('commissar.directives.MediaGroup.controller', [
    '$scope',
    '$element',
    'ParanoidScope',
    function ($scope, $element, ParanoidScope) {
      $scope.controllerName = 'commissar.directives.MediaGroup.controller';
      $scope.mousemove = function (event) {
        ParanoidScope.apply($scope, function () {
          $scope.active = Math.floor(event.offsetX / 200 * $scope.documents.length);
          if ($scope.active > $scope.documents.length - 1) {
            $scope.active = $scope.documents.length - 1;
          }
          if ($scope.active < 0) {
            $scope.active = 0;
          }
        });
      };
      $scope.active = 0;
      $scope.isActive = function ($index) {
        return $scope.active === $index;
      };
      $scope.isOpened = function () {
        var isOpened = $scope.collectionOpened($scope.name);
        console.log('isOpened', isOpened, $scope.name);
        return isOpened;
      };
      $scope.open = function () {
        console.log('open');
        if (!$scope.isOpened()) {
          $scope.collectionOpened($scope.name, true);
        }
      };
      $scope.close = function () {
        console.log('close');
        if ($scope.isOpened()) {
          $scope.collectionOpened($scope.name, false);
        }
      };
      $scope.zoomedDocument = function () {
        var result = null;
        angular.forEach($scope.documents, function (el) {
          var document = el.value;
          console.log(document.title);
          if ($scope.mediaOpened(document.title)) {
            console.log('DOCUMENT FOUND');
            result = document;
          }
        });
        return result;
      };
      $scope.mode = function () {
        if ($scope.isOpened()) {
          if ($scope.zoomedDocument()) {
            return 'zoomed';
          }
          return 'open';
        }
        return 'closed';
      };
      $scope.visible = function () {
        return !$scope.collectionOpened() || $scope.isOpened();
      };
    }
  ]);
  MediaGroupModule.directive('mediagroup', function () {
    var MediaGroup = {
        priority: 0,
        templateUrl: constants.templatePrefix + 'directives/MediaGroup.html',
        replace: true,
        transclude: true,
        restrict: 'AE',
        require: [
          'documents',
          'wark'
        ],
        scope: {
          documents: '=documents',
          name: '=',
          collectionOpened: '=',
          mediaOpened: '='
        },
        controller: 'commissar.directives.MediaGroup.controller'
      };
    return MediaGroup;
  });
  return MediaGroupModule;
});
define('directives/Gallery', [
  'constants',
  'services/ParanoidScope',
  'directives/MediaGroup'
], function (constants) {
  var GalleryModule = angular.module('commissar.directives.Gallery', [
      'commissar.directives.MediaGroup',
      'commissar.services.ParanoidScope'
    ]);
  GalleryModule.controller('commissar.directives.Gallery.controller', [
    '$scope',
    'ParanoidScope',
    function ($scope, ParanoidScope) {
      $scope.name = 'commissar.directives.Gallery.controller';
      $scope.setActiveCollection = function (newCollection) {
        ParanoidScope.apply($scope, function () {
          $scope.activeCollection = newCollection;
        });
      };
      $scope.setActiveImage = function (newImage) {
        ParanoidScope.apply($scope, function () {
          $scope.activeImage = newImage;
        });
      };
      $scope.collectionOpened = function (title, force) {
        if (title === undefined) {
          return $scope.activeCollection;
        }
        if (force === undefined) {
          return $scope.activeCollection === title;
        }
        console.log('opened collection with force');
        console.log(force, title);
        if (force) {
          $scope.setActiveCollection(title);
        } else if ($scope.activeCollection === title) {
          $scope.setActiveCollection(null);
        }
      };
      $scope.mediaOpened = function (title, force) {
        if (title === undefined) {
          return $scope.activeImage;
        }
        if (force === undefined) {
          return $scope.activeImage === title;
        }
        console.log('opened media with force');
        console.log(force, title);
        if (force) {
          $scope.setActiveImage(title);
        } else if ($scope.activeImage === title) {
          $scope.setActiveImage(null);
        }
      };
    }
  ]);
  GalleryModule.directive('gallery', function () {
    var Gallery = {
        priority: 0,
        templateUrl: constants.templatePrefix + 'directives/Gallery.html',
        replace: true,
        transclude: true,
        restrict: 'AE',
        require: ['collections'],
        scope: {
          collections: '=',
          activeCollection: '=',
          activeImage: '='
        },
        controller: 'commissar.directives.Gallery.controller'
      };
    return Gallery;
  });
  return GalleryModule;
});
define('controllers/GalleryCtrl', [
  'constants',
  'directives/UploadForm',
  'directives/MediaGroup',
  'directives/Gallery',
  'services/ImageManager',
  'services/ParanoidScope',
  'services/Authentication',
  'filters/NotThumbnail'
], function (constants) {
  var GalleryCtrlModule = angular.module('commissar.controllers.GalleryCtrl', [
      'commissar.directives.UploadForm',
      'commissar.directives.MediaGroup',
      'commissar.directives.Gallery',
      'commissar.services.ImageManager',
      'commissar.services.ParanoidScope',
      'commissar.services.Authentication',
      'commissar.filters.NotThumbnail'
    ]);
  GalleryCtrlModule.controller('GalleryCtrl', [
    '$scope',
    'ImageManager',
    'ParanoidScope',
    '$routeParams',
    '$location',
    'Authentication',
    function ($scope, ImageManager, ParanoidScope, $routeParams, $location, Authentication) {
      $scope.name = 'GalleryCtrl';
      $scope.collections = {};
      $scope.activeAuthor = Authentication.getUsername();
      $scope.activeCollection = $routeParams.collection;
      $scope.activeImage = $routeParams.image;
      $scope.$watch('activeCollection', function () {
        if ($scope.activeCollection) {
          $location.path('/my/gallery/' + $scope.activeCollection);
        } else {
          $location.path('/my/gallery');
        }
      });
      $scope.$watch('activeImage', function () {
        if ($scope.activeImage && $scope.activeCollection) {
          $location.path('/my/gallery/' + $scope.activeCollection + '/' + $scope.activeImage);
        } else if ($scope.activeCollection) {
          $location.path('/my/gallery/' + $scope.activeCollection);
        } else {
          $location.path('/my/gallery');
        }
      });
      ImageManager.getMyImages().then(function (data) {
        ParanoidScope.apply($scope, function () {
          $scope.collections['All Uploads'] = data;
          angular.forEach(data, function (el) {
            var tags = el.value.tags ? el.value.tags.split(',') : [];
            angular.forEach(tags, function (tag) {
              if ($scope.collections[tag] === undefined) {
                $scope.collections[tag] = [];
              }
              $scope.collections[tag].push(el);
            });
          });
        });
      });
    }
  ]);
  GalleryCtrlModule.config([
    '$routeProvider',
    function ($routeProvider) {
      var options = {
          templateUrl: constants.templatePrefix + 'gallery/index.html',
          controller: 'GalleryCtrl'
        };
      var routes = [
          '/my/gallery',
          '/my/gallery/:collection',
          '/my/gallery/:collection/:image',
          '/:userslug/gallery',
          '/:userslug/gallery/:collection',
          '/:userslug/gallery/:collection/:image'
        ];
      for (var i = 0; i < routes.length; i++) {
        $routeProvider.when(routes[i], options);
      }
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
  'controllers/UploadCtrl',
  'controllers/GalleryCtrl'
], function () {
  var App = angular.module('commissar', [
      'commissar.controllers.LogoutCtrl',
      'commissar.controllers.AdminCtrl',
      'commissar.controllers.IndexCtrl',
      'commissar.controllers.MenuCtrl',
      'commissar.controllers.WelcomeCtrl',
      'commissar.controllers.UploadCtrl',
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