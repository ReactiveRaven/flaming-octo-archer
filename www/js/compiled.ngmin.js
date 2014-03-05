define('constants', [], function () {
  return {
    templatePrefix: 'angular/templates/',
    allowedMediaTypes: ['image']
  };
});
/**
 * @license AngularJS v1.0.8
 * (c) 2010-2012 Google, Inc. http://angularjs.org
 * License: MIT
 */
(function (window, angular, undefined) {
  /**
 * @ngdoc overview
 * @name ngCookies
 */
  angular.module('ngCookies', ['ng']).factory('$cookies', [
    '$rootScope',
    '$browser',
    function ($rootScope, $browser) {
      var cookies = {}, lastCookies = {}, lastBrowserCookies, runEval = false, copy = angular.copy, isUndefined = angular.isUndefined;
      //creates a poller fn that copies all cookies from the $browser to service & inits the service
      $browser.addPollFn(function () {
        var currentCookies = $browser.cookies();
        if (lastBrowserCookies != currentCookies) {
          //relies on browser.cookies() impl
          lastBrowserCookies = currentCookies;
          copy(currentCookies, lastCookies);
          copy(currentCookies, cookies);
          if (runEval)
            $rootScope.$apply();
        }
      })();
      runEval = true;
      //at the end of each eval, push cookies
      //TODO: this should happen before the "delayed" watches fire, because if some cookies are not
      //      strings or browser refuses to store some cookies, we update the model in the push fn.
      $rootScope.$watch(push);
      return cookies;
      /**
       * Pushes all the cookies from the service to the browser and verifies if all cookies were stored.
       */
      function push() {
        var name, value, browserCookies, updated;
        //delete any cookies deleted in $cookies
        for (name in lastCookies) {
          if (isUndefined(cookies[name])) {
            $browser.cookies(name, undefined);
          }
        }
        //update all cookies updated in $cookies
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
        //verify what was actually stored
        if (updated) {
          updated = false;
          browserCookies = $browser.cookies();
          for (name in cookies) {
            if (cookies[name] !== browserCookies[name]) {
              //delete or reset all cookies that the browser dropped from $cookies
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
define('designdocs/commissar_validation_global', [], function () {
  return {
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
      },
      'filters': {
        'should_copy_to_private': function () {
          return true;
        },
        'should_copy_to_public': function (doc, req) {
          return typeof doc.replication !== 'undefined' && typeof doc.replication.status !== 'undefined' && doc.replication.status === 'public' && typeof req.query !== 'undefined' && typeof req.query.x_target === 'commissar_public';
        },
        'should_copy_to_personal': function (doc, req) {
          return typeof doc.author !== 'undefined' && typeof req.query !== 'undefined' && typeof req.query.x_target !== 'undefined' && 'commissar_user_' + doc.author === req.query.x_target || typeof req.query !== 'undefined' && typeof req.query.x_target !== 'undefined' && req.query.x_target.indexOf('commissar_user_') === 0 && typeof doc.replication !== 'undefined' && typeof doc.replication.status !== 'undefined' && doc.replication.status === 'shared' && typeof doc.replication.involved.indexOf(req.query.x_target.substr(15)) !== -1 || doc.id.indexOf('_design/') === 0;
        }
      }
    }
  };
});
define('designdocs/commissar_validation_users', [], function () {
  return {
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
  };
});
// Copyright: 2013, Jochen Eddelbüttel
// MIT License applies
//
angular.module('CornerCouch', ['ng']).factory('cornercouch', [
  '$http',
  function ($http) {
    // Shorthand angular
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
    // Database-level constructor
    // Database name is required parameter
    function CouchDB(dbName, serverUri, getMethod) {
      // CouchDoc accesses the DB level via this variable in the closure
      var dbUri = encodeUri(serverUri, dbName);
      // Inner document constructor
      // Template object can be passed in and gets copied over
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
      // Requires File-API 'file', sorry IE9
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
          // Reload document for local consistency
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
          // Reload document for local consistency
          doc.load();
        });
      };
      CouchDoc.prototype.attachUri = function (attachName) {
        return encodeUri(dbUri, this._id, attachName);
      };
      // Document constructor
      this.docClass = CouchDoc;
      // Basic fields
      this.uri = dbUri;
      this.method = getMethod;
      // Query cursor
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
        // Pop extra row for pagination
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
        // Raise limit by 1 for pagination
        if (qparams.limit)
          qparams.limit++;
        // Convert key parameters to JSON
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
          // Remote server with potential CORS support
          // Enable globally via $http defaults
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
        // name is null in POST response for admins as of Version 1.2.1
        // This patches over the problem
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
    // This is 'cornercouch' - a factory for CouchServer objects
    return function (url, method) {
      return new CouchServer(url, method);
    };
  }
]);
define('CornerCouch', function () {
});
/* globals angular:false */
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
/* global emit:false, angular:false, jQuery:false */
define('services/Couch', [
  '../designdocs/commissar_validation_global',
  '../designdocs/commissar_validation_users',
  'CornerCouch',
  './Random'
], function (commissar_validation_global, commissar_validation_users) {
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
            commissar_validation_global: commissar_validation_global,
            commissar_validation_users: commissar_validation_users
          },
          pushDesignDocs: function () {
            var deferred = $q.defer();
            Couch.getSession().then(function (session) {
              // Admins only plz.
              if (session.roles.indexOf('+admin') === -1) {
                deferred.reject('Cannot push design documents as you are not an admin');
                return false;
              }
              var remoteDocs = [];
              // Loop through all databases
              Object.getOwnPropertyNames(Couch._designDocs).forEach(function (databaseName) {
                // Get a copy of the local database object
                var localDatabase = Couch._designDocs[databaseName];
                // Loop through all documents in the local database
                Object.getOwnPropertyNames(localDatabase).forEach(function (id) {
                  // Apply changes to the document
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
              // Copy the local properties onto the remote document
              Object.getOwnPropertyNames(document).forEach(function (property) {
                remoteDocument[property] = document[property];
              });
            };
            // Copy the document, so we don't modify the original
            var deepCopy = true;
            var document = jQuery.extend(deepCopy, {}, documentObject);
            // Convert all functions to strings
            Couch.stringifyFunctions(document);
            // Get the remote document
            Couch.getDoc(databaseName, document._id).then(function (remoteDocument) {
              // Update remote and save it out
              updateRemote(document, remoteDocument);
              remoteDocument.save().then(function (reply) {
                document._rev = reply.data.rev;
                deferred.resolve(true);
              }, deferred.reject);
            }, function () {
              // Create document, update, and save out
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
/* globals angular:false, $:false */
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
/* globals angular:false */
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
/**
 * marked - a markdown parser
 * Copyright (c) 2011-2013, Christopher Jeffrey. (MIT Licensed)
 * https://github.com/chjj/marked
 */
;
(function () {
  /**
 * Block-Level Grammar
 */
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
  /**
 * Normal Block Grammar
 */
  block.normal = merge({}, block);
  /**
 * GFM Block Grammar
 */
  block.gfm = merge({}, block.normal, {
    fences: /^ *(`{3,}|~{3,}) *(\S+)? *\n([\s\S]+?)\s*\1 *(?:\n+|$)/,
    paragraph: /^/
  });
  block.gfm.paragraph = replace(block.paragraph)('(?!', '(?!' + block.gfm.fences.source.replace('\\1', '\\2') + '|' + block.list.source.replace('\\1', '\\3') + '|')();
  /**
 * GFM + Tables Block Grammar
 */
  block.tables = merge({}, block.gfm, {
    nptable: /^ *(\S.*\|.*)\n *([-:]+ *\|[-| :]*)\n((?:.*\|.*(?:\n|$))*)\n*/,
    table: /^ *\|(.+)\n *\|( *[-:]+[-| :]*)\n((?: *\|.*(?:\n|$))*)\n*/
  });
  /**
 * Block Lexer
 */
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
  /**
 * Expose Block Rules
 */
  Lexer.rules = block;
  /**
 * Static Lex Method
 */
  Lexer.lex = function (src, options) {
    var lexer = new Lexer(options);
    return lexer.lex(src);
  };
  /**
 * Preprocessing
 */
  Lexer.prototype.lex = function (src) {
    src = src.replace(/\r\n|\r/g, '\n').replace(/\t/g, '    ').replace(/\u00a0/g, ' ').replace(/\u2424/g, '\n');
    return this.token(src, true);
  };
  /**
 * Lexing
 */
  Lexer.prototype.token = function (src, top) {
    var src = src.replace(/^ +$/gm, ''), next, loose, cap, bull, b, item, space, i, l;
    while (src) {
      // newline
      if (cap = this.rules.newline.exec(src)) {
        src = src.substring(cap[0].length);
        if (cap[0].length > 1) {
          this.tokens.push({ type: 'space' });
        }
      }
      // code
      if (cap = this.rules.code.exec(src)) {
        src = src.substring(cap[0].length);
        cap = cap[0].replace(/^ {4}/gm, '');
        this.tokens.push({
          type: 'code',
          text: !this.options.pedantic ? cap.replace(/\n+$/, '') : cap
        });
        continue;
      }
      // fences (gfm)
      if (cap = this.rules.fences.exec(src)) {
        src = src.substring(cap[0].length);
        this.tokens.push({
          type: 'code',
          lang: cap[2],
          text: cap[3]
        });
        continue;
      }
      // heading
      if (cap = this.rules.heading.exec(src)) {
        src = src.substring(cap[0].length);
        this.tokens.push({
          type: 'heading',
          depth: cap[1].length,
          text: cap[2]
        });
        continue;
      }
      // table no leading pipe (gfm)
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
      // lheading
      if (cap = this.rules.lheading.exec(src)) {
        src = src.substring(cap[0].length);
        this.tokens.push({
          type: 'heading',
          depth: cap[2] === '=' ? 1 : 2,
          text: cap[1]
        });
        continue;
      }
      // hr
      if (cap = this.rules.hr.exec(src)) {
        src = src.substring(cap[0].length);
        this.tokens.push({ type: 'hr' });
        continue;
      }
      // blockquote
      if (cap = this.rules.blockquote.exec(src)) {
        src = src.substring(cap[0].length);
        this.tokens.push({ type: 'blockquote_start' });
        cap = cap[0].replace(/^ *> ?/gm, '');
        // Pass `top` to keep the current
        // "toplevel" state. This is exactly
        // how markdown.pl works.
        this.token(cap, top);
        this.tokens.push({ type: 'blockquote_end' });
        continue;
      }
      // list
      if (cap = this.rules.list.exec(src)) {
        src = src.substring(cap[0].length);
        bull = cap[2];
        this.tokens.push({
          type: 'list_start',
          ordered: bull.length > 1
        });
        // Get each top-level item.
        cap = cap[0].match(this.rules.item);
        next = false;
        l = cap.length;
        i = 0;
        for (; i < l; i++) {
          item = cap[i];
          // Remove the list item's bullet
          // so it is seen as the next token.
          space = item.length;
          item = item.replace(/^ *([*+-]|\d+\.) +/, '');
          // Outdent whatever the
          // list item contains. Hacky.
          if (~item.indexOf('\n ')) {
            space -= item.length;
            item = !this.options.pedantic ? item.replace(new RegExp('^ {1,' + space + '}', 'gm'), '') : item.replace(/^ {1,4}/gm, '');
          }
          // Determine whether the next list item belongs here.
          // Backpedal if it does not belong in this list.
          if (this.options.smartLists && i !== l - 1) {
            b = block.bullet.exec(cap[i + 1])[0];
            if (bull !== b && !(bull.length > 1 && b.length > 1)) {
              src = cap.slice(i + 1).join('\n') + src;
              i = l - 1;
            }
          }
          // Determine whether item is loose or not.
          // Use: /(^|\n)(?! )[^\n]+\n\n(?!\s*$)/
          // for discount behavior.
          loose = next || /\n\n(?!\s*$)/.test(item);
          if (i !== l - 1) {
            next = item.charAt(item.length - 1) === '\n';
            if (!loose)
              loose = next;
          }
          this.tokens.push({ type: loose ? 'loose_item_start' : 'list_item_start' });
          // Recurse.
          this.token(item, false);
          this.tokens.push({ type: 'list_item_end' });
        }
        this.tokens.push({ type: 'list_end' });
        continue;
      }
      // html
      if (cap = this.rules.html.exec(src)) {
        src = src.substring(cap[0].length);
        this.tokens.push({
          type: this.options.sanitize ? 'paragraph' : 'html',
          pre: cap[1] === 'pre' || cap[1] === 'script' || cap[1] === 'style',
          text: cap[0]
        });
        continue;
      }
      // def
      if (top && (cap = this.rules.def.exec(src))) {
        src = src.substring(cap[0].length);
        this.tokens.links[cap[1].toLowerCase()] = {
          href: cap[2],
          title: cap[3]
        };
        continue;
      }
      // table (gfm)
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
      // top-level paragraph
      if (top && (cap = this.rules.paragraph.exec(src))) {
        src = src.substring(cap[0].length);
        this.tokens.push({
          type: 'paragraph',
          text: cap[1].charAt(cap[1].length - 1) === '\n' ? cap[1].slice(0, -1) : cap[1]
        });
        continue;
      }
      // text
      if (cap = this.rules.text.exec(src)) {
        // Top-level should never reach here.
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
  /**
 * Inline-Level Grammar
 */
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
  /**
 * Normal Inline Grammar
 */
  inline.normal = merge({}, inline);
  /**
 * Pedantic Inline Grammar
 */
  inline.pedantic = merge({}, inline.normal, {
    strong: /^__(?=\S)([\s\S]*?\S)__(?!_)|^\*\*(?=\S)([\s\S]*?\S)\*\*(?!\*)/,
    em: /^_(?=\S)([\s\S]*?\S)_(?!_)|^\*(?=\S)([\s\S]*?\S)\*(?!\*)/
  });
  /**
 * GFM Inline Grammar
 */
  inline.gfm = merge({}, inline.normal, {
    escape: replace(inline.escape)('])', '~|])')(),
    url: /^(https?:\/\/[^\s<]+[^<.,:;"')\]\s])/,
    del: /^~~(?=\S)([\s\S]*?\S)~~/,
    text: replace(inline.text)(']|', '~]|')('|', '|https?://|')()
  });
  /**
 * GFM + Line Breaks Inline Grammar
 */
  inline.breaks = merge({}, inline.gfm, {
    br: replace(inline.br)('{2,}', '*')(),
    text: replace(inline.gfm.text)('{2,}', '*')()
  });
  /**
 * Inline Lexer & Compiler
 */
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
  /**
 * Expose Inline Rules
 */
  InlineLexer.rules = inline;
  /**
 * Static Lexing/Compiling Method
 */
  InlineLexer.output = function (src, links, options) {
    var inline = new InlineLexer(links, options);
    return inline.output(src);
  };
  /**
 * Lexing/Compiling
 */
  InlineLexer.prototype.output = function (src) {
    var out = '', link, text, href, cap;
    while (src) {
      // escape
      if (cap = this.rules.escape.exec(src)) {
        src = src.substring(cap[0].length);
        out += cap[1];
        continue;
      }
      // autolink
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
      // url (gfm)
      if (cap = this.rules.url.exec(src)) {
        src = src.substring(cap[0].length);
        text = escape(cap[1]);
        href = text;
        out += '<a href="' + href + '">' + text + '</a>';
        continue;
      }
      // tag
      if (cap = this.rules.tag.exec(src)) {
        src = src.substring(cap[0].length);
        out += this.options.sanitize ? escape(cap[0]) : cap[0];
        continue;
      }
      // link
      if (cap = this.rules.link.exec(src)) {
        src = src.substring(cap[0].length);
        out += this.outputLink(cap, {
          href: cap[2],
          title: cap[3]
        });
        continue;
      }
      // reflink, nolink
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
      // strong
      if (cap = this.rules.strong.exec(src)) {
        src = src.substring(cap[0].length);
        out += '<strong>' + this.output(cap[2] || cap[1]) + '</strong>';
        continue;
      }
      // em
      if (cap = this.rules.em.exec(src)) {
        src = src.substring(cap[0].length);
        out += '<em>' + this.output(cap[2] || cap[1]) + '</em>';
        continue;
      }
      // code
      if (cap = this.rules.code.exec(src)) {
        src = src.substring(cap[0].length);
        out += '<code>' + escape(cap[2], true) + '</code>';
        continue;
      }
      // br
      if (cap = this.rules.br.exec(src)) {
        src = src.substring(cap[0].length);
        out += '<br>';
        continue;
      }
      // del (gfm)
      if (cap = this.rules.del.exec(src)) {
        src = src.substring(cap[0].length);
        out += '<del>' + this.output(cap[1]) + '</del>';
        continue;
      }
      // text
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
  /**
 * Compile Link
 */
  InlineLexer.prototype.outputLink = function (cap, link) {
    if (cap[0].charAt(0) !== '!') {
      return '<a href="' + escape(link.href) + '"' + (link.title ? ' title="' + escape(link.title) + '"' : '') + '>' + this.output(cap[1]) + '</a>';
    } else {
      return '<img src="' + escape(link.href) + '" alt="' + escape(cap[1]) + '"' + (link.title ? ' title="' + escape(link.title) + '"' : '') + '>';
    }
  };
  /**
 * Smartypants Transformations
 */
  InlineLexer.prototype.smartypants = function (text) {
    if (!this.options.smartypants)
      return text;
    return text.replace(/--/g, '\u2014').replace(/(^|[-\u2014/(\[{"\s])'/g, '$1\u2018').replace(/'/g, '\u2019').replace(/(^|[-\u2014/(\[{\u2018\s])"/g, '$1\u201c').replace(/"/g, '\u201d').replace(/\.{3}/g, '\u2026');
  };
  /**
 * Mangle Links
 */
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
  /**
 * Parsing & Compiling
 */
  function Parser(options) {
    this.tokens = [];
    this.token = null;
    this.options = options || marked.defaults;
  }
  /**
 * Static Parse Method
 */
  Parser.parse = function (src, options) {
    var parser = new Parser(options);
    return parser.parse(src);
  };
  /**
 * Parse Loop
 */
  Parser.prototype.parse = function (src) {
    this.inline = new InlineLexer(src.links, this.options);
    this.tokens = src.reverse();
    var out = '';
    while (this.next()) {
      out += this.tok();
    }
    return out;
  };
  /**
 * Next Token
 */
  Parser.prototype.next = function () {
    return this.token = this.tokens.pop();
  };
  /**
 * Preview Next Token
 */
  Parser.prototype.peek = function () {
    return this.tokens[this.tokens.length - 1] || 0;
  };
  /**
 * Parse Text Tokens
 */
  Parser.prototype.parseText = function () {
    var body = this.token.text;
    while (this.peek().type === 'text') {
      body += '\n' + this.next().text;
    }
    return this.inline.output(body);
  };
  /**
 * Parse Current Token
 */
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
        // header
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
        // body
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
  /**
 * Helpers
 */
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
  /**
 * Marked
 */
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
  /**
 * Options
 */
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
  /**
 * Expose
 */
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
/* globals angular:false */
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
/* globals angular:false */
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
/* globals angular:false */
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
/* globals angular:false */
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
/* globals angular:false */
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
/* globals angular:false */
define('services/CommissionManager', ['./Authentication'], function () {
  var CommissionManagerModule = angular.module('commissar.services.CommissionManager', ['commissar.services.Authentication']);
  CommissionManagerModule.service('CommissionManager', [
    'Authentication',
    '$q',
    '$http',
    function (Authentication, $q, $http) {
      var commissionManager = {};
      commissionManager._commissionsListing = {};
      commissionManager._repliesListing = {};
      commissionManager._completeionConfirmationRequestsListing = {};
      commissionManager.commissions = [];
      commissionManager.replies = [];
      commissionManager.completionConfirmationRequests = [];
      commissionManager._buildDocument = function (document) {
        var deferred = $q.defer();
        Authentication.getUsername().then(function (username) {
          var createdTimeAsMs = new Date().getTime();
          var template = {
              _id: username + '_' + document.type + '_' + createdTimeAsMs,
              author: username,
              createdTimeAsMs: createdTimeAsMs,
              createdTimeAsUnixTime: createdTimeAsMs / 1000 | 0
            };
          document = angular.extend(document, template);
          deferred.resolve(document);
        }, deferred.reject);
        return deferred.promise;
      };
      commissionManager._databaseUrlForUsername = function (username) {
        var databaseName = Authentication.getDatabaseName(username);
        var databaseUrl = '/couchdb/' + databaseName;
        return databaseUrl;
      };
      commissionManager._getUrlForDocumentId = function (id) {
        var deferred = $q.defer();
        commissionManager._getDatabaseUrl.then(function (databaseUrl) {
          var documentUrl = databaseUrl + '/' + id;
          deferred.resolve(documentUrl);
        });
        return deferred.promise;
      };
      commissionManager._getUrlForViewName = function (viewName) {
        var deferred = $q.defer();
        var viewNamePath = '_viewName/' + viewName;
        commissionManager._getUrlForDocumentId(viewNamePath).then(function (url) {
          deferred.resolve(url);
        });
        return deferred.promise;
      };
      commissionManager._createDocument = function (document) {
        var deferred = $q.defer();
        Authentication.getUsername().then(function (username) {
          commissionManager._buildDocument(document).then(function (template) {
            document = angular.extend(template, document);
            commissionManager._getDatabaseUrl().then(function (url) {
              $http.post(url, document).then(function (metadata) {
                document._rev = metadata.rev;
                deferred.resolve(document);
              }, deferred.reject);
            }, deferred.reject);
          }, deferred.reject);
        });
        return deferred.promise;
      };
      commissionManager._getListingFromViewName = function (viewName) {
        var deferred = $q.defer();
        commissionManager._getUrlForViewName(viewName).then(function (url) {
          $http.get(url).then(deferred.resolve, deferred.reject);
        }, deferred.reject);
        return deferred.promise;
      };
      commissionManager._arrayOfDocumentsFromListing = function (listing) {
        var arrayOfDocuments = listing.rows.map(function (row) {
            return row.value;
          });
        return arrayOfDocuments;
      };
      commissionManager._listingPropertyNameForType = function (type) {
        var typePlural = pluralize.plural(type);
        var listingPropertyName = '_' + typePlural + 'Listing';
        return listingPropertyName;
      };
      commissionManager._getListingForAllOfType = function (type) {
        var deferred = $q.defer();
        var typePlural = pluralize.plural(type);
        var allOfTypeViewName = 'all_' + typePlural;
        commissionManager._getListingFromViewName(allOfTypeViewName).then();
      };
      commissionManager._getReplies();
      commissionManager._getCompletionConfirmationRequests();
      return commissionManager;
    }
  ]);
  return CommissionManagerModule;
});
/* globals angular:false */
define('directives/KommiExpandToFit', ['constants'], function (constants) {
  var ExpandToFitModule = angular.module('commissar.directives.KommiExpandToFit', []);
  ExpandToFitModule.directive('kommiExpandToFit', function () {
    return {
      link: function (scope, element) {
        var hiddenDiv = $(document.createElement('div'));
        var content = null;
        var commonClasses = $(element).attr('class');
        $(element).addClass('kommi-expand-to-fit-no-resize');
        hiddenDiv.addClass('kommi-expand-to-fit-hidden-div kommi-expand-to-fit-no-resize ' + commonClasses);
        $('body').append(hiddenDiv);
        var updateHeight = function () {
          content = $(element).val();
          content = content.replace(/\n/g, '<br>');
          hiddenDiv.html(content + '<br class="kommi-expand-to-fit-line-break">');
          $(element).css('height', hiddenDiv.height());
        };
        updateHeight();
        $(element).on('keyup', updateHeight);
      }
    };
  });
  return ExpandToFitModule;
});
/* globals angular:false */
define('directives/KommiEnter', ['constants'], function (constants) {
  var KommiEnterModule = angular.module('commissar.directives.KommiEnter', []);
  KommiEnterModule.directive('kommiEnter', function () {
    return {
      link: function (scope, element, attrs) {
        $(element).keypress(function (e) {
          if (e.which == 13) {
            if (!e.shiftKey)
              scope.$apply(attrs['kommiEnter']);
          }
        });
      }
    };
  });
  return KommiEnterModule;
});
/* globals angular:false */
define('controllers/CommissionPanelCtrl', [
  'constants',
  '../services/Authentication',
  '../services/ParanoidScope',
  '../services/CommissionManager',
  '../directives/KommiExpandToFit',
  '../directives/KommiEnter'
], function (constants) {
  var CommissionPanelCtrlModule = angular.module('commissar.controllers.CommissionPanelCtrl', [
      'commissar.services.ParanoidScope',
      'commissar.services.Authentication',
      'commissar.services.CommissionManager',
      'commissar.directives.KommiExpandToFit',
      'commissar.directives.KommiEnter'
    ]);
  CommissionPanelCtrlModule.controller('CommissionPanelCtrl', [
    'ParanoidScope',
    'Authentication',
    'CommissionManager',
    '$scope',
    function (ParanoidScope, Authentication, CommissionManager, $scope) {
      $scope.commissionPanel = {};
      CommissionManager.getCommissions().then(function (commissions) {
        $scope.kommissionerUser = { name: CommissionManager.username };
        $scope.commissions = CommissionManager.commissions;
        $scope.commissionPanel.activeCommissionListDisclosed = true;
        $scope.commissionPanel.requestCommissionListDisclosed = true;
        $scope.commissionPanel.completeCommissionListDisclosed = false;
        $scope.commissionPanel.sendingReply = false;
        $scope.commissionPanel.selectedCommission = $scope.commissions[0];
      });
      $scope.commissionPanel.attachementsFromCommission = function (commission) {
        var attachments = [];
        if (commission) {
          var attachments = [];
          commission.messages.forEach(function (message) {
            message.attachments.forEach(function (attachment) {
              attachments.push(attachment);
            });
          });
        }
        return attachments;
      };
      $scope.commissionPanel.commissionHasAttachments = function (commission) {
        var attachments = $scope.commissionPanel.attachementsFromCommission(commission);
        return attachments.length > 0;
      };
      $scope.commissionPanel.formatDate = function (date) {
        return moment(date).format('MMM Do, YYYY');
      };
      $scope.commissionPanel.reply = function (replyBody) {
        var selectedCommission = $scope.commissionPanel.selectedCommission;
        var replyMessage = {
            sender: selectedCommission.artist,
            date: new Date(),
            body: selectedCommission.replyBody,
            attachments: []
          };
        var updatedCommission = angular.copy(selectedCommission);
        updatedCommission.messages.unshift(replyMessage);
        delete updatedCommission.replyBody;
        delete updatedCommission.replyDisclosed;
        $scope.commissionPanel.sendingReply = true;
        CommissionManager.updateCommission(updatedCommission).then(function (revisedCommission) {
          revisedCommission.replyBody = '';
          revisedCommission.replyDisclosed = false;
          var selectedCommissionIndex = $scope.commissions.indexOf(selectedCommission);
          $scope.commissions[selectedCommissionIndex] = revisedCommission;
          $scope.commissionPanel.sendingReply = false;
        }, function () {
          $scope.commissionPanel.sendingReply = false;
        });
      };
      $scope.commissionPanel.selectedCommissionShouldPromptForCompletenessConfirmation = function () {
        var selectedCommission = $scope.commissionPanel.selectedCommission;
        if (selectedCommission) {
          var artistMarkedAndUserNotArtist = selectedCommission.artistMarkedAsCompleted && !$scope.commissionPanel.userIsSelectedCommissionArtist();
          var buyerMarkedAndUserNotBuyer = selectedCommission.buyerMarkedAsCompleted && $scope.commissionPanel.userIsSelectedCommissionArtist();
          var artistAndBuyerAggreeSelectedCommissionIsComplete = selectedCommission.artistMarkedAsCompleted == selectedCommission.buyerMarkedAsCompleted;
          return (buyerMarkedAndUserNotBuyer || artistMarkedAndUserNotArtist) && !artistAndBuyerAggreeSelectedCommissionIsComplete;
        }
      };
      $scope.commissionPanel.selectedCommissionShouldShowCompletedMessage = function () {
        var selectedCommission = $scope.commissionPanel.selectedCommission;
        if (selectedCommission) {
          var artistMarkedAndUserIsArtist = selectedCommission.artistMarkedAsCompleted && $scope.commissionPanel.userIsSelectedCommissionArtist();
          var buyerMarkedAndUserIsBuyer = selectedCommission.buyerMarkedAsCompleted && !$scope.commissionPanel.userIsSelectedCommissionArtist();
          var artistAndBuyerAggreeSelectedCommissionIsComplete = selectedCommission.artistMarkedAsCompleted == selectedCommission.buyerMarkedAsCompleted;
          return (artistMarkedAndUserIsArtist || buyerMarkedAndUserIsBuyer) && !artistAndBuyerAggreeSelectedCommissionIsComplete;
        }
      };
      $scope.commissionPanel.userIsSelectedCommissionArtist = function () {
        var selectedCommission = $scope.commissionPanel.selectedCommission;
        return selectedCommission.artist.name == $scope.kommissionerUser.name;
      };
      $scope.commissionPanel.markSelectedCommissionAsCompleted = function () {
        var selectedCommission = $scope.commissionPanel.selectedCommission;
        if ($scope.commissionPanel.userIsSelectedCommissionArtist()) {
          selectedCommission.artistMarkedAsCompleted = true;
        } else {
          selectedCommission.buyerMarkedAsCompleted = true;
        }
        $scope.commissionPanel.changeSelectedCommissionStatusToCompletedIfCommissionIsCompleted();
      };
      $scope.commissionPanel.toggleSelectedCommissionCompletion = function () {
        if ($scope.commissionPanel.userIsSelectedCommissionArtist()) {
          $scope.commissionPanel.selectedCommission.artistMarkedAsCompleted = !$scope.commissionPanel.selectedCommission.artistMarkedAsCompleted;
        } else {
          $scope.commissionPanel.selectedCommission.buyerMarkedAsCompleted = !$scope.commissionPanel.selectedCommission.buyerMarkedAsCompleted;
        }
        $scope.commissionPanel.changeSelectedCommissionStatusToCompletedIfCommissionIsCompleted();
      };
      $scope.commissionPanel.markSelectedCommissionAsIncomplete = function () {
        var selectedCommission = $scope.commissionPanel.selectedCommission;
        selectedCommission.artistMarkedAsCompleted = false;
        selectedCommission.buyerMarkedAsCompleted = false;
      };
      $scope.commissionPanel.changeSelectedCommissionStatusToCompletedIfCommissionIsCompleted = function () {
        var selectedCommission = $scope.commissionPanel.selectedCommission;
        if (selectedCommission.artistMarkedAsCompleted && selectedCommission.buyerMarkedAsCompleted) {
          selectedCommission.status = 'complete';
        }
      };
    }
  ]);
  CommissionPanelCtrlModule.config([
    '$routeProvider',
    function ($routeProvider) {
      $routeProvider.when('/commissions', {
        templateUrl: constants.templatePrefix + 'commissionPanel.html',
        controller: 'CommissionPanelCtrl'
      });
    }
  ]);
  return CommissionPanelCtrlModule;
});
/* globals angular:false */
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
/* globals angular:false */
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
/* globals angular:false */
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
        // Needed to trigger the form to update as it doesn't actually 
        // contain 'loginFormUsername' as a binding!
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
/* global angular:false */
var angular = angular;
define('controllers/MenuCtrl', [
  '../services/Authentication',
  '../filters/Capitalize',
  '../directives/LoginForm',
  '../services/ParanoidScope'
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
/* globals angular:false, jQuery:false */
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
/* globals angular:false */
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
/* globals angular:false */
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
/* globals angular:false */
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
//! moment.js
//! version : 2.5.1
//! authors : Tim Wood, Iskren Chernev, Moment.js contributors
//! license : MIT
//! momentjs.com
(function (undefined) {
  /************************************
        Constants
    ************************************/
  var moment, VERSION = '2.5.1', global = this, round = Math.round, i, YEAR = 0, MONTH = 1, DATE = 2, HOUR = 3, MINUTE = 4, SECOND = 5, MILLISECOND = 6,
    // internal storage for language config files
    languages = {},
    // moment internal properties
    momentProperties = {
      _isAMomentObject: null,
      _i: null,
      _f: null,
      _l: null,
      _strict: null,
      _isUTC: null,
      _offset: null,
      _pf: null,
      _lang: null
    },
    // check for nodeJS
    hasModule = typeof module !== 'undefined' && module.exports && typeof require !== 'undefined',
    // ASP.NET json date format regex
    aspNetJsonRegex = /^\/?Date\((\-?\d+)/i, aspNetTimeSpanJsonRegex = /(\-)?(?:(\d*)\.)?(\d+)\:(\d+)(?:\:(\d+)\.?(\d{3})?)?/,
    // from http://docs.closure-library.googlecode.com/git/closure_goog_date_date.js.source.html
    // somewhat more in line with 4.4.3.2 2004 spec, but allows decimal anywhere
    isoDurationRegex = /^(-)?P(?:(?:([0-9,.]*)Y)?(?:([0-9,.]*)M)?(?:([0-9,.]*)D)?(?:T(?:([0-9,.]*)H)?(?:([0-9,.]*)M)?(?:([0-9,.]*)S)?)?|([0-9,.]*)W)$/,
    // format tokens
    formattingTokens = /(\[[^\[]*\])|(\\)?(Mo|MM?M?M?|Do|DDDo|DD?D?D?|ddd?d?|do?|w[o|w]?|W[o|W]?|YYYYYY|YYYYY|YYYY|YY|gg(ggg?)?|GG(GGG?)?|e|E|a|A|hh?|HH?|mm?|ss?|S{1,4}|X|zz?|ZZ?|.)/g, localFormattingTokens = /(\[[^\[]*\])|(\\)?(LT|LL?L?L?|l{1,4})/g,
    // parsing token regexes
    parseTokenOneOrTwoDigits = /\d\d?/,
    // 0 - 99
    parseTokenOneToThreeDigits = /\d{1,3}/,
    // 0 - 999
    parseTokenOneToFourDigits = /\d{1,4}/,
    // 0 - 9999
    parseTokenOneToSixDigits = /[+\-]?\d{1,6}/,
    // -999,999 - 999,999
    parseTokenDigits = /\d+/,
    // nonzero number of digits
    parseTokenWord = /[0-9]*['a-z\u00A0-\u05FF\u0700-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]+|[\u0600-\u06FF\/]+(\s*?[\u0600-\u06FF]+){1,2}/i,
    // any word (or two) characters or numbers including two/three word month in arabic.
    parseTokenTimezone = /Z|[\+\-]\d\d:?\d\d/gi,
    // +00:00 -00:00 +0000 -0000 or Z
    parseTokenT = /T/i,
    // T (ISO separator)
    parseTokenTimestampMs = /[\+\-]?\d+(\.\d{1,3})?/,
    // 123456789 123456789.123
    //strict parsing regexes
    parseTokenOneDigit = /\d/,
    // 0 - 9
    parseTokenTwoDigits = /\d\d/,
    // 00 - 99
    parseTokenThreeDigits = /\d{3}/,
    // 000 - 999
    parseTokenFourDigits = /\d{4}/,
    // 0000 - 9999
    parseTokenSixDigits = /[+-]?\d{6}/,
    // -999,999 - 999,999
    parseTokenSignedNumber = /[+-]?\d+/,
    // -inf - inf
    // iso 8601 regex
    // 0000-00-00 0000-W00 or 0000-W00-0 + T + 00 or 00:00 or 00:00:00 or 00:00:00.000 + +00:00 or +0000 or +00)
    isoRegex = /^\s*(?:[+-]\d{6}|\d{4})-(?:(\d\d-\d\d)|(W\d\d$)|(W\d\d-\d)|(\d\d\d))((T| )(\d\d(:\d\d(:\d\d(\.\d+)?)?)?)?([\+\-]\d\d(?::?\d\d)?|\s*Z)?)?$/, isoFormat = 'YYYY-MM-DDTHH:mm:ssZ', isoDates = [
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
    ],
    // iso time formats and regexes
    isoTimes = [
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
    ],
    // timezone chunker "+10:00" > ["10", "00"] or "-1530" > ["-15", "30"]
    parseTimezoneChunker = /([\+\-]|\d\d)/gi,
    // getter and setter names
    proxyGettersAndSetters = 'Date|Hours|Minutes|Seconds|Milliseconds'.split('|'), unitMillisecondFactors = {
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
    },
    // format function strings
    formatFunctions = {},
    // tokens to ordinalize and pad
    ordinalizeTokens = 'DDD w W M D d'.split(' '), paddedTokens = 'M D H h m s w W'.split(' '), formatTokenFunctions = {
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
    // We need to deep clone this object, and es5 standard is not very
    // helpful.
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
  /************************************
        Constructors
    ************************************/
  function Language() {
  }
  // Moment prototype object
  function Moment(config) {
    checkOverflow(config);
    extend(this, config);
  }
  // Duration Constructor
  function Duration(duration) {
    var normalizedInput = normalizeObjectUnits(duration), years = normalizedInput.year || 0, months = normalizedInput.month || 0, weeks = normalizedInput.week || 0, days = normalizedInput.day || 0, hours = normalizedInput.hour || 0, minutes = normalizedInput.minute || 0, seconds = normalizedInput.second || 0, milliseconds = normalizedInput.millisecond || 0;
    // representation for dateAddRemove
    this._milliseconds = +milliseconds + seconds * 1000 + minutes * 60000 + hours * 3600000;
    // 1000 * 60 * 60
    // Because of dateAddRemove treats 24 hours as different from a
    // day when working around DST, we need to store them separately
    this._days = +days + weeks * 7;
    // It is impossible translate months into days without knowing
    // which months you are are talking about, so we have to store
    // it separately.
    this._months = +months + years * 12;
    this._data = {};
    this._bubble();
  }
  /************************************
        Helpers
    ************************************/
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
  // left zero fill a number
  // see http://jsperf.com/left-zero-filling for performance comparison
  function leftZeroFill(number, targetLength, forceSign) {
    var output = '' + Math.abs(number), sign = number >= 0;
    while (output.length < targetLength) {
      output = '0' + output;
    }
    return (sign ? forceSign ? '+' : '' : '-') + output;
  }
  // helper function for _.addTime and _.subtractTime
  function addOrSubtractDurationFromMoment(mom, duration, isAdding, ignoreUpdateOffset) {
    var milliseconds = duration._milliseconds, days = duration._days, months = duration._months, minutes, hours;
    if (milliseconds) {
      mom._d.setTime(+mom._d + milliseconds * isAdding);
    }
    // store the minutes and hours so we can restore them
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
    // restore the minutes and hours after possibly changing dst
    if (days || months) {
      mom.minute(minutes);
      mom.hour(hours);
    }
  }
  // check if is an array
  function isArray(input) {
    return Object.prototype.toString.call(input) === '[object Array]';
  }
  function isDate(input) {
    return Object.prototype.toString.call(input) === '[object Date]' || input instanceof Date;
  }
  // compare two arrays, return the number of differences
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
  // Return a moment from input, that is local/utc/zone equivalent to model.
  function makeAs(input, model) {
    return model._isUTC ? moment(input).zone(model._offset || 0) : moment(input).local();
  }
  /************************************
        Languages
    ************************************/
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
        // make the regex if we don't have it already
        if (!this._monthsParse[i]) {
          mom = moment.utc([
            2000,
            i
          ]);
          regex = '^' + this.months(mom, '') + '|^' + this.monthsShort(mom, '');
          this._monthsParse[i] = new RegExp(regex.replace('.', ''), 'i');
        }
        // test the regex
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
        // make the regex if we don't have it already
        if (!this._weekdaysParse[i]) {
          mom = moment([
            2000,
            1
          ]).day(i);
          regex = '^' + this.weekdays(mom, '') + '|^' + this.weekdaysShort(mom, '') + '|^' + this.weekdaysMin(mom, '');
          this._weekdaysParse[i] = new RegExp(regex.replace('.', ''), 'i');
        }
        // test the regex
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
      // IE8 Quirks Mode & IE7 Standards Mode do not allow accessing strings like arrays
      // Using charAt should be more compatible.
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
  // Loads a language definition into the `languages` cache.  The function
  // takes a key and optionally values.  If not in the browser and no values
  // are provided, it will load the language file module.  As a convenience,
  // this function also returns the language values.
  function loadLang(key, values) {
    values.abbr = key;
    if (!languages[key]) {
      languages[key] = new Language();
    }
    languages[key].set(values);
    return languages[key];
  }
  // Remove a language from the `languages` cache. Mostly useful in tests.
  function unloadLang(key) {
    delete languages[key];
  }
  // Determines which language definition to use and returns it.
  //
  // With no parameters, it will return the global language.  If you
  // pass in a language key, such as 'en', it will return the
  // definition for 'en', so long as 'en' has already been loaded using
  // moment.lang.
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
      //short-circuit everything else
      lang = get(key);
      if (lang) {
        return lang;
      }
      key = [key];
    }
    //pick the language from the array
    //try ['en-au', 'en-gb'] as 'en-au', 'en-gb', 'en', as in move through the list trying each
    //substring from most specific to least, but move to the next array item if it's a more specific variant than the current root
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
          //the next array item is better than a shallower substring of this one
          break;
        }
        j--;
      }
      i++;
    }
    return moment.fn._lang;
  }
  /************************************
        Formatting
    ************************************/
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
  // format date using native date object
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
  /************************************
        Parsing
    ************************************/
  // get the regex to find the next token
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
    /* falls through */
    case 'SS':
      if (strict) {
        return parseTokenTwoDigits;
      }
    /* falls through */
    case 'SSS':
      if (strict) {
        return parseTokenThreeDigits;
      }
    /* falls through */
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
  // function to convert string input to date
  function addTimeToArrayFromToken(token, input, config) {
    var a, datePartArray = config._a;
    switch (token) {
    // MONTH
    case 'M':
    // fall through to MM
    case 'MM':
      if (input != null) {
        datePartArray[MONTH] = toInt(input) - 1;
      }
      break;
    case 'MMM':
    // fall through to MMMM
    case 'MMMM':
      a = getLangDefinition(config._l).monthsParse(input);
      // if we didn't find a month name, mark the date as invalid.
      if (a != null) {
        datePartArray[MONTH] = a;
      } else {
        config._pf.invalidMonth = input;
      }
      break;
    // DAY OF MONTH
    case 'D':
    // fall through to DD
    case 'DD':
      if (input != null) {
        datePartArray[DATE] = toInt(input);
      }
      break;
    // DAY OF YEAR
    case 'DDD':
    // fall through to DDDD
    case 'DDDD':
      if (input != null) {
        config._dayOfYear = toInt(input);
      }
      break;
    // YEAR
    case 'YY':
      datePartArray[YEAR] = toInt(input) + (toInt(input) > 68 ? 1900 : 2000);
      break;
    case 'YYYY':
    case 'YYYYY':
    case 'YYYYYY':
      datePartArray[YEAR] = toInt(input);
      break;
    // AM / PM
    case 'a':
    // fall through to A
    case 'A':
      config._isPm = getLangDefinition(config._l).isPM(input);
      break;
    // 24 HOUR
    case 'H':
    // fall through to hh
    case 'HH':
    // fall through to hh
    case 'h':
    // fall through to hh
    case 'hh':
      datePartArray[HOUR] = toInt(input);
      break;
    // MINUTE
    case 'm':
    // fall through to mm
    case 'mm':
      datePartArray[MINUTE] = toInt(input);
      break;
    // SECOND
    case 's':
    // fall through to ss
    case 'ss':
      datePartArray[SECOND] = toInt(input);
      break;
    // MILLISECOND
    case 'S':
    case 'SS':
    case 'SSS':
    case 'SSSS':
      datePartArray[MILLISECOND] = toInt(('0.' + input) * 1000);
      break;
    // UNIX TIMESTAMP WITH MS
    case 'X':
      config._d = new Date(parseFloat(input) * 1000);
      break;
    // TIMEZONE
    case 'Z':
    // fall through to ZZ
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
    /* falls through */
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
  // convert an array to a date.
  // the array should mirror the parameters below
  // note: all values past the year are optional and will default to the lowest possible value.
  // [year, month, day , hour, minute, second, millisecond]
  function dateFromConfig(config) {
    var i, date, input = [], currentDate, yearToUse, fixYear, w, temp, lang, weekday, week;
    if (config._d) {
      return;
    }
    currentDate = currentDateArray(config);
    //compute day of the year from weeks and weekdays
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
        //if we're parsing 'd', then the low day numbers may be next week
        if (w.d != null && weekday < lang._week.dow) {
          week++;
        }
        temp = dayOfYearFromWeeks(fixYear(w.gg), week, weekday, lang._week.doy, lang._week.dow);
      }
      config._a[YEAR] = temp.year;
      config._dayOfYear = temp.dayOfYear;
    }
    //if the day of the year is set, figure out what it is
    if (config._dayOfYear) {
      yearToUse = config._a[YEAR] == null ? currentDate[YEAR] : config._a[YEAR];
      if (config._dayOfYear > daysInYear(yearToUse)) {
        config._pf._overflowDayOfYear = true;
      }
      date = makeUTCDate(yearToUse, 0, config._dayOfYear);
      config._a[MONTH] = date.getUTCMonth();
      config._a[DATE] = date.getUTCDate();
    }
    // Default to current date.
    // * if no year, month, day of month are given, default to today
    // * if day of month is given, default month and year
    // * if month is given, default only year
    // * if year is given, don't default anything
    for (i = 0; i < 3 && config._a[i] == null; ++i) {
      config._a[i] = input[i] = currentDate[i];
    }
    // Zero out whatever was not defaulted, including time
    for (; i < 7; i++) {
      config._a[i] = input[i] = config._a[i] == null ? i === 2 ? 1 : 0 : config._a[i];
    }
    // add the offsets to the time to be parsed so that we can have a clean array for checking isValid
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
  // date from string and format string
  function makeDateFromStringAndFormat(config) {
    config._a = [];
    config._pf.empty = true;
    // This array is used to make a Date, either with `new Date` or `Date.UTC`
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
      // don't parse if it's not a known token
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
    // add remaining unparsed input length to the string
    config._pf.charsLeftOver = stringLength - totalParsedInputLength;
    if (string.length > 0) {
      config._pf.unusedInput.push(string);
    }
    // handle am pm
    if (config._isPm && config._a[HOUR] < 12) {
      config._a[HOUR] += 12;
    }
    // if is 12 am, change hours to 0
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
  // Code from http://stackoverflow.com/questions/3561493/is-there-a-regexp-escape-function-in-javascript
  function regexpEscape(s) {
    return s.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
  }
  // date from string and array of format strings
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
      // if there is any input that was not parsed add a penalty for that format
      currentScore += tempConfig._pf.charsLeftOver;
      //or tokens
      currentScore += tempConfig._pf.unusedTokens.length * 10;
      tempConfig._pf.score = currentScore;
      if (scoreToBeat == null || currentScore < scoreToBeat) {
        scoreToBeat = currentScore;
        bestMoment = tempConfig;
      }
    }
    extend(config, bestMoment || tempConfig);
  }
  // date from iso format
  function makeDateFromString(config) {
    var i, l, string = config._i, match = isoRegex.exec(string);
    if (match) {
      config._pf.iso = true;
      for (i = 0, l = isoDates.length; i < l; i++) {
        if (isoDates[i][1].exec(string)) {
          // match[5] should be "T" or undefined
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
    //can't just apply() to create a date:
    //http://stackoverflow.com/questions/181348/instantiating-a-javascript-object-by-calling-prototype-constructor-apply
    var date = new Date(y, m, d, h, M, s, ms);
    //the date constructor doesn't accept years < 1970
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
  /************************************
        Relative Time
    ************************************/
  // helper function for moment.fn.from, moment.fn.fromNow, and moment.duration.fn.humanize
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
  /************************************
        Week of Year
    ************************************/
  // firstDayOfWeek       0 = sun, 6 = sat
  //                      the day of the week that starts the week
  //                      (usually sunday or monday)
  // firstDayOfWeekOfYear 0 = sun, 6 = sat
  //                      the first week is the week that contains the first
  //                      of this day of the week
  //                      (eg. ISO weeks use thursday (4))
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
  //http://en.wikipedia.org/wiki/ISO_week_date#Calculating_a_date_given_the_year.2C_week_number_and_weekday
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
  /************************************
        Top Level Functions
    ************************************/
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
    // object construction must be done this way.
    // https://github.com/moment/moment/issues/1423
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
  // creating with utc
  moment.utc = function (input, format, lang, strict) {
    var c;
    if (typeof lang === 'boolean') {
      strict = lang;
      lang = undefined;
    }
    // object construction must be done this way.
    // https://github.com/moment/moment/issues/1423
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
  // creating with unix timestamp (in seconds)
  moment.unix = function (input) {
    return moment(input * 1000);
  };
  // duration
  moment.duration = function (input, key) {
    var duration = input,
      // matching against regexp is expensive, do it on demand
      match = null, sign, ret, parseIso;
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
        // We'd normally use ~~inp for this, but unfortunately it also
        // converts floats to ints.
        // inp may be undefined, so careful calling replace on it.
        var res = inp && parseFloat(inp.replace(',', '.'));
        // apply sign while we're at it
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
  // version number
  moment.version = VERSION;
  // default format
  moment.defaultFormat = isoFormat;
  // This function will be called whenever a moment is mutated.
  // It is intended to keep the offset in sync with the timezone.
  moment.updateOffset = function () {
  };
  // This function will load languages and then set the global language.  If
  // no arguments are passed in, it will simply return the current global
  // language key.
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
  // returns language data
  moment.langData = function (key) {
    if (key && key._lang && key._lang._abbr) {
      key = key._lang._abbr;
    }
    return getLangDefinition(key);
  };
  // compare moment object
  moment.isMoment = function (obj) {
    return obj instanceof Moment || obj != null && obj.hasOwnProperty('_isAMomentObject');
  };
  // for typechecking Duration objects
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
  /************************************
        Moment Prototype
    ************************************/
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
      // switch args to support add('s', 1) and add(1, 's')
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
      // switch args to support subtract('s', 1) and subtract(1, 's')
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
        // average number of days in the months in the given dates
        diff = (this.daysInMonth() + that.daysInMonth()) * 43200000;
        // 24 * 60 * 60 * 1000 / 2
        // difference in months
        output = (this.year() - that.year()) * 12 + (this.month() - that.month());
        // adjust by taking difference in days, average number of days
        // and dst in the given months.
        output += (this - moment(this).startOf('month') - (that - moment(that).startOf('month'))) / diff;
        // same as above but with zones, to negate all dst
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
      // We want to compare the start of today, vs this.
      // Getting start-of-today depends on whether we're zone'd or not.
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
      // the following switch intentionally omits break keywords
      // to utilize falling through the cases.
      switch (units) {
      case 'year':
        this.month(0);
      /* falls through */
      case 'month':
        this.date(1);
      /* falls through */
      case 'week':
      case 'isoWeek':
      case 'day':
        this.hours(0);
      /* falls through */
      case 'hour':
        this.minutes(0);
      /* falls through */
      case 'minute':
        this.seconds(0);
      /* falls through */
      case 'second':
        this.milliseconds(0);  /* falls through */
      }
      // weeks are a special case
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
      // behaves the same as moment#day except
      // as a getter, returns 7 instead of 0 (1-7 range instead of 0-6)
      // as a setter, sunday should belong to the previous week.
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
  // helper for adding shortcuts
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
  // loop through and add shortcuts (Month, Date, Hours, Minutes, Seconds, Milliseconds)
  for (i = 0; i < proxyGettersAndSetters.length; i++) {
    makeGetterAndSetter(proxyGettersAndSetters[i].toLowerCase().replace(/s$/, ''), proxyGettersAndSetters[i]);
  }
  // add shortcut for year (uses different syntax than the getter/setter 'year' == 'FullYear')
  makeGetterAndSetter('year', 'FullYear');
  // add plural methods
  moment.fn.days = moment.fn.day;
  moment.fn.months = moment.fn.month;
  moment.fn.weeks = moment.fn.week;
  moment.fn.isoWeeks = moment.fn.isoWeek;
  // add aliased format methods
  moment.fn.toJSON = moment.fn.toISOString;
  /************************************
        Duration Prototype
    ************************************/
  extend(moment.duration.fn = Duration.prototype, {
    _bubble: function () {
      var milliseconds = this._milliseconds, days = this._days, months = this._months, data = this._data, seconds, minutes, hours, years;
      // The following code bubbles up values, see the tests for
      // examples of what that means.
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
      // supports only 2.0-style add(1, 's') or add(moment)
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
      // inspired by https://github.com/dordille/moment-isoduration/blob/master/moment.isoduration.js
      var years = Math.abs(this.years()), months = Math.abs(this.months()), days = Math.abs(this.days()), hours = Math.abs(this.hours()), minutes = Math.abs(this.minutes()), seconds = Math.abs(this.seconds() + this.milliseconds() / 1000);
      if (!this.asSeconds()) {
        // this is the same as C#'s (Noda) and python (isodate)...
        // but not other JS (goog.date)
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
  /************************************
        Default Lang
    ************************************/
  // Set default language, other languages will inherit from English.
  moment.lang('en', {
    ordinal: function (number) {
      var b = number % 10, output = toInt(number % 100 / 10) === 1 ? 'th' : b === 1 ? 'st' : b === 2 ? 'nd' : b === 3 ? 'rd' : 'th';
      return number + output;
    }
  });
  /* EMBED_LANGUAGES */
  /************************************
        Exposing Moment
    ************************************/
  function makeGlobal(deprecate) {
    var warned = false, local_moment = moment;
    /*global ender:false */
    if (typeof ender !== 'undefined') {
      return;
    }
    // here, `this` means `window` in the browser, or `global` on the server
    // add `moment` as a global object via a string identifier,
    // for Closure Compiler "advanced" mode
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
  // CommonJS module is defined
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
        // If user provided noGlobal, he is aware of global
        makeGlobal(module.config().noGlobal === undefined);
      }
      return moment;
    });
  } else {
    makeGlobal();
  }
}.call(this));
/* angular-moment.js / v0.6.2 / (c) 2013, 2014 Uri Shaked / MIT Licence */
(function () {
  /**
	 * Apply a timezone onto a given moment object - if moment-timezone.js is included
	 * Otherwise, it'll not apply any timezone shift.
	 * @param {Moment} aMoment
	 * @param {string} timezone
	 * @returns {Moment}
	 */
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
            // Milliseconds since the epoch
            value = new Date(value);
          }
          // else assume the given value is already a date
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
        scope.$on('amMoment:languageChange', function () {
          updateMoment();
        });
      };
    }
  ]).factory('amMoment', [
    '$window',
    '$rootScope',
    function ($window, $rootScope) {
      return {
        changeLanguage: function (lang) {
          var result = $window.moment.lang(lang);
          if (angular.isDefined(lang)) {
            $rootScope.$broadcast('amMoment:languageChange');
          }
          return result;
        }
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
          // Milliseconds since the epoch
          value = new Date(parseInt(value, 10));
        }
        // else assume the given value is already a date
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
          // Milliseconds since the epoch
          value = new Date(parseInt(value, 10));
        }
        // else assume the given value is already a date
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
        // else assume the given value is already a duration in a format (miliseconds, etc)
        return $window.moment.duration(value, format).humanize(suffix);
      };
    }
  ]);
}());
define('angular-moment', function () {
});
/* globals angular:false */
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
        return '/thumbnail/' + type + '/commissar_user_' + $scope.document.author + '/' + $scope.document._id + '/' + possibles[0];
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
/* globals angular:false */
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
/* globals angular:false */
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
          activeImage: '=',
          allUploads: '=',
          allUploadsTitle: '='
        },
        controller: 'commissar.directives.Gallery.controller'
      };
    return Gallery;
  });
  return GalleryModule;
});
/* globals angular:false */
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
      $scope.allUploads = [];
      $scope.allUploadsTitle = 'All Uploads';
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
          angular.forEach(data, function (el) {
            var tags = el.value.tags ? el.value.tags.split(',') : [];
            angular.forEach(tags, function (tag) {
              if ($scope.collections[tag] === undefined) {
                $scope.collections[tag] = [];
              }
              $scope.collections[tag].push(el);
            });
            $scope.allUploads.push(el);
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
/* globals angular:false */
define('app', [
  'controllers/LogoutCtrl',
  'controllers/AdminCtrl',
  'controllers/CommissionPanelCtrl',
  'controllers/IndexCtrl',
  'controllers/WelcomeCtrl',
  'controllers/MenuCtrl',
  'controllers/UploadCtrl',
  'controllers/GalleryCtrl'
], function () {
  var App = angular.module('commissar', [
      'ngRoute',
      'commissar.controllers.LogoutCtrl',
      'commissar.controllers.AdminCtrl',
      'commissar.controllers.CommissionPanelCtrl',
      'commissar.controllers.IndexCtrl',
      'commissar.controllers.MenuCtrl',
      'commissar.controllers.WelcomeCtrl',
      'commissar.controllers.UploadCtrl',
      'commissar.controllers.GalleryCtrl'
    ]);
  App.config([
    '$locationProvider',
    '$routeProvider',
    function ($locationProvider, $routeProvider) {
      $locationProvider.html5Mode(false);
      $locationProvider.hashPrefix('!');
    }
  ]);
  return App;
});
/**
 * @license AngularJS v1.2.14
 * (c) 2010-2014 Google, Inc. http://angularjs.org
 * License: MIT
 */
(function (window, angular, undefined) {
  /**
 * @ngdoc object
 * @name angular.mock
 * @description
 *
 * Namespace from 'angular-mocks.js' which contains testing related code.
 */
  angular.mock = {};
  /**
 * ! This is a private undocumented service !
 *
 * @name $browser
 *
 * @description
 * This service is a mock implementation of {@link ng.$browser}. It provides fake
 * implementation for commonly used browser apis that are hard to test, e.g. setTimeout, xhr,
 * cookies, etc...
 *
 * The api of this service is the same as that of the real {@link ng.$browser $browser}, except
 * that there are several helper methods available which can be used in tests.
 */
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
    // used by url polling fn
    self.pollFns = [];
    // TODO(vojta): remove this temporary api
    self.$$completeOutstandingRequest = angular.noop;
    self.$$incOutstandingRequestCount = angular.noop;
    // register url polling fn
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
    /**
   * @name $browser#defer.now
   *
   * @description
   * Current milliseconds mock time.
   */
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
    /**
   * @name $browser#defer.flush
   *
   * @description
   * Flushes all pending requests and executes the defer callbacks.
   *
   * @param {number=} number of milliseconds to flush. See {@link #defer.now}
   */
    self.defer.flush = function (delay) {
      if (angular.isDefined(delay)) {
        self.defer.now += delay;
      } else {
        if (self.deferredFns.length) {
          self.defer.now = self.deferredFns[self.deferredFns.length - 1].time;
        } else {
          throw new Error('No deferred tasks to be flushed');
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
        if (angular.isUndefined(value)) {
          delete this.cookieHash[name];
        } else {
          if (angular.isString(value) && value.length <= 4096) {
            //strict cookie storage limits
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
  /**
 * @ngdoc provider
 * @name $exceptionHandlerProvider
 *
 * @description
 * Configures the mock implementation of {@link ng.$exceptionHandler} to rethrow or to log errors
 * passed into the `$exceptionHandler`.
 */
  /**
 * @ngdoc service
 * @name $exceptionHandler
 *
 * @description
 * Mock implementation of {@link ng.$exceptionHandler} that rethrows or logs errors passed
 * into it. See {@link ngMock.$exceptionHandlerProvider $exceptionHandlerProvider} for configuration
 * information.
 *
 *
 * ```js
 *   describe('$exceptionHandlerProvider', function() {
 *
 *     it('should capture log messages and exceptions', function() {
 *
 *       module(function($exceptionHandlerProvider) {
 *         $exceptionHandlerProvider.mode('log');
 *       });
 *
 *       inject(function($log, $exceptionHandler, $timeout) {
 *         $timeout(function() { $log.log(1); });
 *         $timeout(function() { $log.log(2); throw 'banana peel'; });
 *         $timeout(function() { $log.log(3); });
 *         expect($exceptionHandler.errors).toEqual([]);
 *         expect($log.assertEmpty());
 *         $timeout.flush();
 *         expect($exceptionHandler.errors).toEqual(['banana peel']);
 *         expect($log.log.logs).toEqual([[1], [2], [3]]);
 *       });
 *     });
 *   });
 * ```
 */
  angular.mock.$ExceptionHandlerProvider = function () {
    var handler;
    /**
   * @ngdoc method
   * @name $exceptionHandlerProvider#mode
   *
   * @description
   * Sets the logging mode.
   *
   * @param {string} mode Mode of operation, defaults to `rethrow`.
   *
   *   - `rethrow`: If any errors are passed into the handler in tests, it typically
   *                means that there is a bug in the application or test, so this mock will
   *                make these tests fail.
   *   - `log`: Sometimes it is desirable to test that an error is thrown, for this case the `log`
   *            mode stores an array of errors in `$exceptionHandler.errors`, to allow later
   *            assertion of them. See {@link ngMock.$log#assertEmpty assertEmpty()} and
   *            {@link ngMock.$log#reset reset()}
   */
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
        throw new Error('Unknown mode \'' + mode + '\', only \'log\'/\'rethrow\' modes are allowed!');
      }
    };
    this.$get = function () {
      return handler;
    };
    this.mode('rethrow');
  };
  /**
 * @ngdoc service
 * @name $log
 *
 * @description
 * Mock implementation of {@link ng.$log} that gathers all logged messages in arrays
 * (one array per logging level). These arrays are exposed as `logs` property of each of the
 * level-specific log function, e.g. for level `error` the array is exposed as `$log.error.logs`.
 *
 */
  angular.mock.$LogProvider = function () {
    var debug = true;
    function concat(array1, array2, index) {
      return array1.concat(Array.prototype.slice.call(array2, index));
    }
    this.debugEnabled = function (flag) {
      if (angular.isDefined(flag)) {
        debug = flag;
        return this;
      } else {
        return debug;
      }
    };
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
          },
          debug: function () {
            if (debug) {
              $log.debug.logs.push(concat([], arguments, 0));
            }
          }
        };
      /**
     * @ngdoc method
     * @name $log#reset
     *
     * @description
     * Reset all of the logging arrays to empty.
     */
      $log.reset = function () {
        /**
       * @ngdoc property
       * @name $log#log.logs
       *
       * @description
       * Array of messages logged using {@link ngMock.$log#log}.
       *
       * @example
       * ```js
       * $log.log('Some Log');
       * var first = $log.log.logs.unshift();
       * ```
       */
        $log.log.logs = [];
        /**
       * @ngdoc property
       * @name $log#info.logs
       *
       * @description
       * Array of messages logged using {@link ngMock.$log#info}.
       *
       * @example
       * ```js
       * $log.info('Some Info');
       * var first = $log.info.logs.unshift();
       * ```
       */
        $log.info.logs = [];
        /**
       * @ngdoc property
       * @name $log#warn.logs
       *
       * @description
       * Array of messages logged using {@link ngMock.$log#warn}.
       *
       * @example
       * ```js
       * $log.warn('Some Warning');
       * var first = $log.warn.logs.unshift();
       * ```
       */
        $log.warn.logs = [];
        /**
       * @ngdoc property
       * @name $log#error.logs
       *
       * @description
       * Array of messages logged using {@link ngMock.$log#error}.
       *
       * @example
       * ```js
       * $log.error('Some Error');
       * var first = $log.error.logs.unshift();
       * ```
       */
        $log.error.logs = [];
        /**
       * @ngdoc property
       * @name $log#debug.logs
       *
       * @description
       * Array of messages logged using {@link ngMock.$log#debug}.
       *
       * @example
       * ```js
       * $log.debug('Some Error');
       * var first = $log.debug.logs.unshift();
       * ```
       */
        $log.debug.logs = [];
      };
      /**
     * @ngdoc method
     * @name $log#assertEmpty
     *
     * @description
     * Assert that the all of the logging methods have no logged messages. If messages present, an
     * exception is thrown.
     */
      $log.assertEmpty = function () {
        var errors = [];
        angular.forEach([
          'error',
          'warn',
          'info',
          'log',
          'debug'
        ], function (logLevel) {
          angular.forEach($log[logLevel].logs, function (log) {
            angular.forEach(log, function (logItem) {
              errors.push('MOCK $log (' + logLevel + '): ' + String(logItem) + '\n' + (logItem.stack || ''));
            });
          });
        });
        if (errors.length) {
          errors.unshift('Expected $log to be empty! Either a message was logged unexpectedly, or ' + 'an expected log message was not checked and removed:');
          errors.push('');
          throw new Error(errors.join('\n---------\n'));
        }
      };
      $log.reset();
      return $log;
    };
  };
  /**
 * @ngdoc service
 * @name $interval
 *
 * @description
 * Mock implementation of the $interval service.
 *
 * Use {@link ngMock.$interval#flush `$interval.flush(millis)`} to
 * move forward by `millis` milliseconds and trigger any functions scheduled to run in that
 * time.
 *
 * @param {function()} fn A function that should be called repeatedly.
 * @param {number} delay Number of milliseconds between each function call.
 * @param {number=} [count=0] Number of times to repeat. If not set, or 0, will repeat
 *   indefinitely.
 * @param {boolean=} [invokeApply=true] If set to `false` skips model dirty checking, otherwise
 *   will invoke `fn` within the {@link ng.$rootScope.Scope#$apply $apply} block.
 * @returns {promise} A promise which will be notified on each iteration.
 */
  angular.mock.$IntervalProvider = function () {
    this.$get = [
      '$rootScope',
      '$q',
      function ($rootScope, $q) {
        var repeatFns = [], nextRepeatId = 0, now = 0;
        var $interval = function (fn, delay, count, invokeApply) {
          var deferred = $q.defer(), promise = deferred.promise, iteration = 0, skipApply = angular.isDefined(invokeApply) && !invokeApply;
          count = angular.isDefined(count) ? count : 0, promise.then(null, null, fn);
          promise.$$intervalId = nextRepeatId;
          function tick() {
            deferred.notify(iteration++);
            if (count > 0 && iteration >= count) {
              var fnIndex;
              deferred.resolve(iteration);
              angular.forEach(repeatFns, function (fn, index) {
                if (fn.id === promise.$$intervalId)
                  fnIndex = index;
              });
              if (fnIndex !== undefined) {
                repeatFns.splice(fnIndex, 1);
              }
            }
            if (!skipApply)
              $rootScope.$apply();
          }
          repeatFns.push({
            nextTime: now + delay,
            delay: delay,
            fn: tick,
            id: nextRepeatId,
            deferred: deferred
          });
          repeatFns.sort(function (a, b) {
            return a.nextTime - b.nextTime;
          });
          nextRepeatId++;
          return promise;
        };
        /**
     * @ngdoc method
     * @name $interval#cancel
     *
     * @description
     * Cancels a task associated with the `promise`.
     *
     * @param {number} promise A promise from calling the `$interval` function.
     * @returns {boolean} Returns `true` if the task was successfully cancelled.
     */
        $interval.cancel = function (promise) {
          if (!promise)
            return false;
          var fnIndex;
          angular.forEach(repeatFns, function (fn, index) {
            if (fn.id === promise.$$intervalId)
              fnIndex = index;
          });
          if (fnIndex !== undefined) {
            repeatFns[fnIndex].deferred.reject('canceled');
            repeatFns.splice(fnIndex, 1);
            return true;
          }
          return false;
        };
        /**
     * @ngdoc method
     * @name $interval#flush
     * @description
     *
     * Runs interval tasks scheduled to be run in the next `millis` milliseconds.
     *
     * @param {number=} millis maximum timeout amount to flush up until.
     *
     * @return {number} The amount of time moved forward.
     */
        $interval.flush = function (millis) {
          now += millis;
          while (repeatFns.length && repeatFns[0].nextTime <= now) {
            var task = repeatFns[0];
            task.fn();
            task.nextTime += task.delay;
            repeatFns.sort(function (a, b) {
              return a.nextTime - b.nextTime;
            });
          }
          return millis;
        };
        return $interval;
      }
    ];
  };
  /* jshint -W101 */
  /* The R_ISO8061_STR regex is never going to fit into the 100 char limit!
 * This directive should go inside the anonymous function but a bug in JSHint means that it would
 * not be enacted early enough to prevent the warning.
 */
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
  /**
 * @ngdoc type
 * @name angular.mock.TzDate
 * @description
 *
 * *NOTE*: this is not an injectable instance, just a globally available mock class of `Date`.
 *
 * Mock of the Date type which has its timezone specified via constructor arg.
 *
 * The main purpose is to create Date-like instances with timezone fixed to the specified timezone
 * offset, so that we can test code that depends on local timezone settings without dependency on
 * the time zone settings of the machine where the code is running.
 *
 * @param {number} offset Offset of the *desired* timezone in hours (fractions will be honored)
 * @param {(number|string)} timestamp Timestamp representing the desired time in *UTC*
 *
 * @example
 * !!!! WARNING !!!!!
 * This is not a complete Date object so only methods that were implemented can be called safely.
 * To make matters worse, TzDate instances inherit stuff from Date via a prototype.
 *
 * We do our best to intercept calls to "unimplemented" methods, but since the list of methods is
 * incomplete we might be missing some non-standard methods. This can result in errors like:
 * "Date.prototype.foo called on incompatible Object".
 *
 * ```js
 * var newYearInBratislava = new TzDate(-1, '2009-12-31T23:00:00Z');
 * newYearInBratislava.getTimezoneOffset() => -60;
 * newYearInBratislava.getFullYear() => 2010;
 * newYearInBratislava.getMonth() => 0;
 * newYearInBratislava.getDate() => 1;
 * newYearInBratislava.getHours() => 0;
 * newYearInBratislava.getMinutes() => 0;
 * newYearInBratislava.getSeconds() => 0;
 * ```
 *
 */
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
    self.getMilliseconds = function () {
      return self.date.getMilliseconds();
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
    // provide this method only on browsers that already have it
    if (self.toISOString) {
      self.toISOString = function () {
        return padNumber(self.origDate.getUTCFullYear(), 4) + '-' + padNumber(self.origDate.getUTCMonth() + 1, 2) + '-' + padNumber(self.origDate.getUTCDate(), 2) + 'T' + padNumber(self.origDate.getUTCHours(), 2) + ':' + padNumber(self.origDate.getUTCMinutes(), 2) + ':' + padNumber(self.origDate.getUTCSeconds(), 2) + '.' + padNumber(self.origDate.getUTCMilliseconds(), 3) + 'Z';
      };
    }
    //hide all methods not implemented in this mock that the Date prototype exposes
    var unimplementedMethods = [
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
        throw new Error('Method \'' + methodName + '\' is not implemented in the TzDate mock');
      };
    });
    return self;
  };
  //make "tzDateInstance instanceof Date" return true
  angular.mock.TzDate.prototype = Date.prototype;
  /* jshint +W101 */
  angular.mock.animate = angular.module('ngAnimateMock', ['ng']).config([
    '$provide',
    function ($provide) {
      var reflowQueue = [];
      $provide.value('$$animateReflow', function (fn) {
        var index = reflowQueue.length;
        reflowQueue.push(fn);
        return function cancel() {
          reflowQueue.splice(index, 1);
        };
      });
      $provide.decorator('$animate', function ($delegate, $$asyncCallback) {
        var animate = {
            queue: [],
            enabled: $delegate.enabled,
            triggerCallbacks: function () {
              $$asyncCallback.flush();
            },
            triggerReflow: function () {
              angular.forEach(reflowQueue, function (fn) {
                fn();
              });
              reflowQueue = [];
            }
          };
        angular.forEach([
          'enter',
          'leave',
          'move',
          'addClass',
          'removeClass',
          'setClass'
        ], function (method) {
          animate[method] = function () {
            animate.queue.push({
              event: method,
              element: arguments[0],
              args: arguments
            });
            $delegate[method].apply($delegate, arguments);
          };
        });
        return animate;
      });
    }
  ]);
  /**
 * @ngdoc function
 * @name angular.mock.dump
 * @description
 *
 * *NOTE*: this is not an injectable instance, just a globally available function.
 *
 * Method for serializing common angular objects (scope, elements, etc..) into strings, useful for
 * debugging.
 *
 * This method is also available on window, where it can be used to display objects on debug
 * console.
 *
 * @param {*} object - any object to turn into string.
 * @return {string} a serialized string of the argument
 */
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
          // TODO(i): this prevents methods being logged,
          // we should have a better way to serialize objects
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
        if (Object.prototype.hasOwnProperty.call(scope, key) && !key.match(/^(\$|this)/)) {
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
  /**
 * @ngdoc service
 * @name $httpBackend
 * @description
 * Fake HTTP backend implementation suitable for unit testing applications that use the
 * {@link ng.$http $http service}.
 *
 * *Note*: For fake HTTP backend implementation suitable for end-to-end testing or backend-less
 * development please see {@link ngMockE2E.$httpBackend e2e $httpBackend mock}.
 *
 * During unit testing, we want our unit tests to run quickly and have no external dependencies so
 * we don’t want to send [XHR](https://developer.mozilla.org/en/xmlhttprequest) or
 * [JSONP](http://en.wikipedia.org/wiki/JSONP) requests to a real server. All we really need is
 * to verify whether a certain request has been sent or not, or alternatively just let the
 * application make requests, respond with pre-trained responses and assert that the end result is
 * what we expect it to be.
 *
 * This mock implementation can be used to respond with static or dynamic responses via the
 * `expect` and `when` apis and their shortcuts (`expectGET`, `whenPOST`, etc).
 *
 * When an Angular application needs some data from a server, it calls the $http service, which
 * sends the request to a real server using $httpBackend service. With dependency injection, it is
 * easy to inject $httpBackend mock (which has the same API as $httpBackend) and use it to verify
 * the requests and respond with some testing data without sending a request to real server.
 *
 * There are two ways to specify what test data should be returned as http responses by the mock
 * backend when the code under test makes http requests:
 *
 * - `$httpBackend.expect` - specifies a request expectation
 * - `$httpBackend.when` - specifies a backend definition
 *
 *
 * # Request Expectations vs Backend Definitions
 *
 * Request expectations provide a way to make assertions about requests made by the application and
 * to define responses for those requests. The test will fail if the expected requests are not made
 * or they are made in the wrong order.
 *
 * Backend definitions allow you to define a fake backend for your application which doesn't assert
 * if a particular request was made or not, it just returns a trained response if a request is made.
 * The test will pass whether or not the request gets made during testing.
 *
 *
 * <table class="table">
 *   <tr><th width="220px"></th><th>Request expectations</th><th>Backend definitions</th></tr>
 *   <tr>
 *     <th>Syntax</th>
 *     <td>.expect(...).respond(...)</td>
 *     <td>.when(...).respond(...)</td>
 *   </tr>
 *   <tr>
 *     <th>Typical usage</th>
 *     <td>strict unit tests</td>
 *     <td>loose (black-box) unit testing</td>
 *   </tr>
 *   <tr>
 *     <th>Fulfills multiple requests</th>
 *     <td>NO</td>
 *     <td>YES</td>
 *   </tr>
 *   <tr>
 *     <th>Order of requests matters</th>
 *     <td>YES</td>
 *     <td>NO</td>
 *   </tr>
 *   <tr>
 *     <th>Request required</th>
 *     <td>YES</td>
 *     <td>NO</td>
 *   </tr>
 *   <tr>
 *     <th>Response required</th>
 *     <td>optional (see below)</td>
 *     <td>YES</td>
 *   </tr>
 * </table>
 *
 * In cases where both backend definitions and request expectations are specified during unit
 * testing, the request expectations are evaluated first.
 *
 * If a request expectation has no response specified, the algorithm will search your backend
 * definitions for an appropriate response.
 *
 * If a request didn't match any expectation or if the expectation doesn't have the response
 * defined, the backend definitions are evaluated in sequential order to see if any of them match
 * the request. The response from the first matched definition is returned.
 *
 *
 * # Flushing HTTP requests
 *
 * The $httpBackend used in production always responds to requests with responses asynchronously.
 * If we preserved this behavior in unit testing we'd have to create async unit tests, which are
 * hard to write, understand, and maintain. However, the testing mock can't respond
 * synchronously because that would change the execution of the code under test. For this reason the
 * mock $httpBackend has a `flush()` method, which allows the test to explicitly flush pending
 * requests and thus preserve the async api of the backend while allowing the test to execute
 * synchronously.
 *
 *
 * # Unit testing with mock $httpBackend
 * The following code shows how to setup and use the mock backend when unit testing a controller.
 * First we create the controller under test:
 *
  ```js
  // The controller code
  function MyController($scope, $http) {
    var authToken;

    $http.get('/auth.py').success(function(data, status, headers) {
      authToken = headers('A-Token');
      $scope.user = data;
    });

    $scope.saveMessage = function(message) {
      var headers = { 'Authorization': authToken };
      $scope.status = 'Saving...';

      $http.post('/add-msg.py', message, { headers: headers } ).success(function(response) {
        $scope.status = '';
      }).error(function() {
        $scope.status = 'ERROR!';
      });
    };
  }
  ```
 *
 * Now we setup the mock backend and create the test specs:
 *
  ```js
    // testing controller
    describe('MyController', function() {
       var $httpBackend, $rootScope, createController;

       beforeEach(inject(function($injector) {
         // Set up the mock http service responses
         $httpBackend = $injector.get('$httpBackend');
         // backend definition common for all tests
         $httpBackend.when('GET', '/auth.py').respond({userId: 'userX'}, {'A-Token': 'xxx'});

         // Get hold of a scope (i.e. the root scope)
         $rootScope = $injector.get('$rootScope');
         // The $controller service is used to create instances of controllers
         var $controller = $injector.get('$controller');

         createController = function() {
           return $controller('MyController', {'$scope' : $rootScope });
         };
       }));


       afterEach(function() {
         $httpBackend.verifyNoOutstandingExpectation();
         $httpBackend.verifyNoOutstandingRequest();
       });


       it('should fetch authentication token', function() {
         $httpBackend.expectGET('/auth.py');
         var controller = createController();
         $httpBackend.flush();
       });


       it('should send msg to server', function() {
         var controller = createController();
         $httpBackend.flush();

         // now you don’t care about the authentication, but
         // the controller will still send the request and
         // $httpBackend will respond without you having to
         // specify the expectation and response for this request

         $httpBackend.expectPOST('/add-msg.py', 'message content').respond(201, '');
         $rootScope.saveMessage('message content');
         expect($rootScope.status).toBe('Saving...');
         $httpBackend.flush();
         expect($rootScope.status).toBe('');
       });


       it('should send auth header', function() {
         var controller = createController();
         $httpBackend.flush();

         $httpBackend.expectPOST('/add-msg.py', undefined, function(headers) {
           // check if the header was send, if it wasn't the expectation won't
           // match the request and the test will fail
           return headers['Authorization'] == 'xxx';
         }).respond(201, '');

         $rootScope.saveMessage('whatever');
         $httpBackend.flush();
       });
    });
   ```
 */
  angular.mock.$HttpBackendProvider = function () {
    this.$get = [
      '$rootScope',
      createHttpBackendMock
    ];
  };
  /**
 * General factory function for $httpBackend mock.
 * Returns instance for unit testing (when no arguments specified):
 *   - passing through is disabled
 *   - auto flushing is disabled
 *
 * Returns instance for e2e testing (when `$delegate` and `$browser` specified):
 *   - passing through (delegating request to real backend) is enabled
 *   - auto flushing is enabled
 *
 * @param {Object=} $delegate Real $httpBackend instance (allow passing through if specified)
 * @param {Object=} $browser Auto-flushing enabled if specified
 * @return {Object} Instance of $httpBackend mock
 */
  function createHttpBackendMock($rootScope, $delegate, $browser) {
    var definitions = [], expectations = [], responses = [], responsesPush = angular.bind(responses, responses.push), copy = angular.copy;
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
    // TODO(vojta): change params to: method, url, data, headers, callback
    function $httpBackend(method, url, data, callback, headers, timeout, withCredentials) {
      var xhr = new MockXhr(), expectation = expectations[0], wasExpected = false;
      function prettyPrint(data) {
        return angular.isString(data) || angular.isFunction(data) || data instanceof RegExp ? data : angular.toJson(data);
      }
      function wrapResponse(wrapped) {
        if (!$browser && timeout && timeout.then)
          timeout.then(handleTimeout);
        return handleResponse;
        function handleResponse() {
          var response = wrapped.response(method, url, data, headers);
          xhr.$$respHeaders = response[2];
          callback(copy(response[0]), copy(response[1]), xhr.getAllResponseHeaders());
        }
        function handleTimeout() {
          for (var i = 0, ii = responses.length; i < ii; i++) {
            if (responses[i] === handleResponse) {
              responses.splice(i, 1);
              callback(-1, undefined, '');
              break;
            }
          }
        }
      }
      if (expectation && expectation.match(method, url)) {
        if (!expectation.matchData(data))
          throw new Error('Expected ' + expectation + ' with different data\n' + 'EXPECTED: ' + prettyPrint(expectation.data) + '\nGOT:      ' + data);
        if (!expectation.matchHeaders(headers))
          throw new Error('Expected ' + expectation + ' with different headers\n' + 'EXPECTED: ' + prettyPrint(expectation.headers) + '\nGOT:      ' + prettyPrint(headers));
        expectations.shift();
        if (expectation.response) {
          responses.push(wrapResponse(expectation));
          return;
        }
        wasExpected = true;
      }
      var i = -1, definition;
      while (definition = definitions[++i]) {
        if (definition.match(method, url, data, headers || {})) {
          if (definition.response) {
            // if $browser specified, we do auto flush all requests
            ($browser ? $browser.defer : responsesPush)(wrapResponse(definition));
          } else if (definition.passThrough) {
            $delegate(method, url, data, callback, headers, timeout, withCredentials);
          } else
            throw new Error('No response defined !');
          return;
        }
      }
      throw wasExpected ? new Error('No response defined !') : new Error('Unexpected request: ' + method + ' ' + url + '\n' + (expectation ? 'Expected ' + expectation : 'No more request expected'));
    }
    /**
   * @ngdoc method
   * @name $httpBackend#when
   * @description
   * Creates a new backend definition.
   *
   * @param {string} method HTTP method.
   * @param {string|RegExp} url HTTP url.
   * @param {(string|RegExp|function(string))=} data HTTP request body or function that receives
   *   data string and returns true if the data is as expected.
   * @param {(Object|function(Object))=} headers HTTP headers or function that receives http header
   *   object and returns true if the headers match the current definition.
   * @returns {requestHandler} Returns an object with `respond` method that controls how a matched
   *   request is handled.
   *
   *  - respond –
   *      `{function([status,] data[, headers])|function(function(method, url, data, headers)}`
   *    – The respond method takes a set of static data to be returned or a function that can return
   *    an array containing response status (number), response data (string) and response headers
   *    (Object).
   */
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
    /**
   * @ngdoc method
   * @name $httpBackend#whenGET
   * @description
   * Creates a new backend definition for GET requests. For more info see `when()`.
   *
   * @param {string|RegExp} url HTTP url.
   * @param {(Object|function(Object))=} headers HTTP headers.
   * @returns {requestHandler} Returns an object with `respond` method that control how a matched
   * request is handled.
   */
    /**
   * @ngdoc method
   * @name $httpBackend#whenHEAD
   * @description
   * Creates a new backend definition for HEAD requests. For more info see `when()`.
   *
   * @param {string|RegExp} url HTTP url.
   * @param {(Object|function(Object))=} headers HTTP headers.
   * @returns {requestHandler} Returns an object with `respond` method that control how a matched
   * request is handled.
   */
    /**
   * @ngdoc method
   * @name $httpBackend#whenDELETE
   * @description
   * Creates a new backend definition for DELETE requests. For more info see `when()`.
   *
   * @param {string|RegExp} url HTTP url.
   * @param {(Object|function(Object))=} headers HTTP headers.
   * @returns {requestHandler} Returns an object with `respond` method that control how a matched
   * request is handled.
   */
    /**
   * @ngdoc method
   * @name $httpBackend#whenPOST
   * @description
   * Creates a new backend definition for POST requests. For more info see `when()`.
   *
   * @param {string|RegExp} url HTTP url.
   * @param {(string|RegExp|function(string))=} data HTTP request body or function that receives
   *   data string and returns true if the data is as expected.
   * @param {(Object|function(Object))=} headers HTTP headers.
   * @returns {requestHandler} Returns an object with `respond` method that control how a matched
   * request is handled.
   */
    /**
   * @ngdoc method
   * @name $httpBackend#whenPUT
   * @description
   * Creates a new backend definition for PUT requests.  For more info see `when()`.
   *
   * @param {string|RegExp} url HTTP url.
   * @param {(string|RegExp|function(string))=} data HTTP request body or function that receives
   *   data string and returns true if the data is as expected.
   * @param {(Object|function(Object))=} headers HTTP headers.
   * @returns {requestHandler} Returns an object with `respond` method that control how a matched
   * request is handled.
   */
    /**
   * @ngdoc method
   * @name $httpBackend#whenJSONP
   * @description
   * Creates a new backend definition for JSONP requests. For more info see `when()`.
   *
   * @param {string|RegExp} url HTTP url.
   * @returns {requestHandler} Returns an object with `respond` method that control how a matched
   * request is handled.
   */
    createShortMethods('when');
    /**
   * @ngdoc method
   * @name $httpBackend#expect
   * @description
   * Creates a new request expectation.
   *
   * @param {string} method HTTP method.
   * @param {string|RegExp} url HTTP url.
   * @param {(string|RegExp|function(string)|Object)=} data HTTP request body or function that
   *  receives data string and returns true if the data is as expected, or Object if request body
   *  is in JSON format.
   * @param {(Object|function(Object))=} headers HTTP headers or function that receives http header
   *   object and returns true if the headers match the current expectation.
   * @returns {requestHandler} Returns an object with `respond` method that control how a matched
   *  request is handled.
   *
   *  - respond –
   *    `{function([status,] data[, headers])|function(function(method, url, data, headers)}`
   *    – The respond method takes a set of static data to be returned or a function that can return
   *    an array containing response status (number), response data (string) and response headers
   *    (Object).
   */
    $httpBackend.expect = function (method, url, data, headers) {
      var expectation = new MockHttpExpectation(method, url, data, headers);
      expectations.push(expectation);
      return {
        respond: function (status, data, headers) {
          expectation.response = createResponse(status, data, headers);
        }
      };
    };
    /**
   * @ngdoc method
   * @name $httpBackend#expectGET
   * @description
   * Creates a new request expectation for GET requests. For more info see `expect()`.
   *
   * @param {string|RegExp} url HTTP url.
   * @param {Object=} headers HTTP headers.
   * @returns {requestHandler} Returns an object with `respond` method that control how a matched
   * request is handled. See #expect for more info.
   */
    /**
   * @ngdoc method
   * @name $httpBackend#expectHEAD
   * @description
   * Creates a new request expectation for HEAD requests. For more info see `expect()`.
   *
   * @param {string|RegExp} url HTTP url.
   * @param {Object=} headers HTTP headers.
   * @returns {requestHandler} Returns an object with `respond` method that control how a matched
   *   request is handled.
   */
    /**
   * @ngdoc method
   * @name $httpBackend#expectDELETE
   * @description
   * Creates a new request expectation for DELETE requests. For more info see `expect()`.
   *
   * @param {string|RegExp} url HTTP url.
   * @param {Object=} headers HTTP headers.
   * @returns {requestHandler} Returns an object with `respond` method that control how a matched
   *   request is handled.
   */
    /**
   * @ngdoc method
   * @name $httpBackend#expectPOST
   * @description
   * Creates a new request expectation for POST requests. For more info see `expect()`.
   *
   * @param {string|RegExp} url HTTP url.
   * @param {(string|RegExp|function(string)|Object)=} data HTTP request body or function that
   *  receives data string and returns true if the data is as expected, or Object if request body
   *  is in JSON format.
   * @param {Object=} headers HTTP headers.
   * @returns {requestHandler} Returns an object with `respond` method that control how a matched
   *   request is handled.
   */
    /**
   * @ngdoc method
   * @name $httpBackend#expectPUT
   * @description
   * Creates a new request expectation for PUT requests. For more info see `expect()`.
   *
   * @param {string|RegExp} url HTTP url.
   * @param {(string|RegExp|function(string)|Object)=} data HTTP request body or function that
   *  receives data string and returns true if the data is as expected, or Object if request body
   *  is in JSON format.
   * @param {Object=} headers HTTP headers.
   * @returns {requestHandler} Returns an object with `respond` method that control how a matched
   *   request is handled.
   */
    /**
   * @ngdoc method
   * @name $httpBackend#expectPATCH
   * @description
   * Creates a new request expectation for PATCH requests. For more info see `expect()`.
   *
   * @param {string|RegExp} url HTTP url.
   * @param {(string|RegExp|function(string)|Object)=} data HTTP request body or function that
   *  receives data string and returns true if the data is as expected, or Object if request body
   *  is in JSON format.
   * @param {Object=} headers HTTP headers.
   * @returns {requestHandler} Returns an object with `respond` method that control how a matched
   *   request is handled.
   */
    /**
   * @ngdoc method
   * @name $httpBackend#expectJSONP
   * @description
   * Creates a new request expectation for JSONP requests. For more info see `expect()`.
   *
   * @param {string|RegExp} url HTTP url.
   * @returns {requestHandler} Returns an object with `respond` method that control how a matched
   *   request is handled.
   */
    createShortMethods('expect');
    /**
   * @ngdoc method
   * @name $httpBackend#flush
   * @description
   * Flushes all pending requests using the trained responses.
   *
   * @param {number=} count Number of responses to flush (in the order they arrived). If undefined,
   *   all pending requests will be flushed. If there are no pending requests when the flush method
   *   is called an exception is thrown (as this typically a sign of programming error).
   */
    $httpBackend.flush = function (count) {
      $rootScope.$digest();
      if (!responses.length)
        throw new Error('No pending request to flush !');
      if (angular.isDefined(count)) {
        while (count--) {
          if (!responses.length)
            throw new Error('No more pending request to flush !');
          responses.shift()();
        }
      } else {
        while (responses.length) {
          responses.shift()();
        }
      }
      $httpBackend.verifyNoOutstandingExpectation();
    };
    /**
   * @ngdoc method
   * @name $httpBackend#verifyNoOutstandingExpectation
   * @description
   * Verifies that all of the requests defined via the `expect` api were made. If any of the
   * requests were not made, verifyNoOutstandingExpectation throws an exception.
   *
   * Typically, you would call this method following each test case that asserts requests using an
   * "afterEach" clause.
   *
   * ```js
   *   afterEach($httpBackend.verifyNoOutstandingExpectation);
   * ```
   */
    $httpBackend.verifyNoOutstandingExpectation = function () {
      $rootScope.$digest();
      if (expectations.length) {
        throw new Error('Unsatisfied requests: ' + expectations.join(', '));
      }
    };
    /**
   * @ngdoc method
   * @name $httpBackend#verifyNoOutstandingRequest
   * @description
   * Verifies that there are no outstanding requests that need to be flushed.
   *
   * Typically, you would call this method following each test case that asserts requests using an
   * "afterEach" clause.
   *
   * ```js
   *   afterEach($httpBackend.verifyNoOutstandingRequest);
   * ```
   */
    $httpBackend.verifyNoOutstandingRequest = function () {
      if (responses.length) {
        throw new Error('Unflushed requests: ' + responses.length);
      }
    };
    /**
   * @ngdoc method
   * @name $httpBackend#resetExpectations
   * @description
   * Resets all request expectations, but preserves all backend definitions. Typically, you would
   * call resetExpectations during a multiple-phase test when you want to reuse the same instance of
   * $httpBackend mock.
   */
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
      if (data && angular.isFunction(data))
        return data(d);
      if (data && !angular.isString(data))
        return angular.equals(data, angular.fromJson(d));
      return data == d;
    };
    this.toString = function () {
      return method + ' ' + url;
    };
  }
  function createMockXhr() {
    return new MockXhr();
  }
  function MockXhr() {
    // hack for testing $http, $httpBackend
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
      // the lookup must be case insensitive,
      // that's why we try two quick lookups first and full scan last
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
  /**
 * @ngdoc service
 * @name $timeout
 * @description
 *
 * This service is just a simple decorator for {@link ng.$timeout $timeout} service
 * that adds a "flush" and "verifyNoPendingTasks" methods.
 */
  angular.mock.$TimeoutDecorator = function ($delegate, $browser) {
    /**
   * @ngdoc method
   * @name $timeout#flush
   * @description
   *
   * Flushes the queue of pending tasks.
   *
   * @param {number=} delay maximum timeout amount to flush up until
   */
    $delegate.flush = function (delay) {
      $browser.defer.flush(delay);
    };
    /**
   * @ngdoc method
   * @name $timeout#verifyNoPendingTasks
   * @description
   *
   * Verifies that there are no pending tasks that need to be flushed.
   */
    $delegate.verifyNoPendingTasks = function () {
      if ($browser.deferredFns.length) {
        throw new Error('Deferred tasks to flush (' + $browser.deferredFns.length + '): ' + formatPendingTasksAsString($browser.deferredFns));
      }
    };
    function formatPendingTasksAsString(tasks) {
      var result = [];
      angular.forEach(tasks, function (task) {
        result.push('{id: ' + task.id + ', ' + 'time: ' + task.time + '}');
      });
      return result.join(', ');
    }
    return $delegate;
  };
  angular.mock.$RAFDecorator = function ($delegate) {
    var queue = [];
    var rafFn = function (fn) {
      var index = queue.length;
      queue.push(fn);
      return function () {
        queue.splice(index, 1);
      };
    };
    rafFn.supported = $delegate.supported;
    rafFn.flush = function () {
      if (queue.length === 0) {
        throw new Error('No rAF callbacks present');
      }
      var length = queue.length;
      for (var i = 0; i < length; i++) {
        queue[i]();
      }
      queue = [];
    };
    return rafFn;
  };
  angular.mock.$AsyncCallbackDecorator = function ($delegate) {
    var callbacks = [];
    var addFn = function (fn) {
      callbacks.push(fn);
    };
    addFn.flush = function () {
      angular.forEach(callbacks, function (fn) {
        fn();
      });
      callbacks = [];
    };
    return addFn;
  };
  /**
 *
 */
  angular.mock.$RootElementProvider = function () {
    this.$get = function () {
      return angular.element('<div ng-app></div>');
    };
  };
  /**
 * @ngdoc module
 * @name ngMock
 * @description
 *
 * # ngMock
 *
 * The `ngMock` module providers support to inject and mock Angular services into unit tests.
 * In addition, ngMock also extends various core ng services such that they can be
 * inspected and controlled in a synchronous manner within test code.
 *
 *
 * <div doc-module-components="ngMock"></div>
 *
 */
  angular.module('ngMock', ['ng']).provider({
    $browser: angular.mock.$BrowserProvider,
    $exceptionHandler: angular.mock.$ExceptionHandlerProvider,
    $log: angular.mock.$LogProvider,
    $interval: angular.mock.$IntervalProvider,
    $httpBackend: angular.mock.$HttpBackendProvider,
    $rootElement: angular.mock.$RootElementProvider
  }).config([
    '$provide',
    function ($provide) {
      $provide.decorator('$timeout', angular.mock.$TimeoutDecorator);
      $provide.decorator('$$rAF', angular.mock.$RAFDecorator);
      $provide.decorator('$$asyncCallback', angular.mock.$AsyncCallbackDecorator);
    }
  ]);
  /**
 * @ngdoc module
 * @name ngMockE2E
 * @module ngMockE2E
 * @description
 *
 * The `ngMockE2E` is an angular module which contains mocks suitable for end-to-end testing.
 * Currently there is only one mock present in this module -
 * the {@link ngMockE2E.$httpBackend e2e $httpBackend} mock.
 */
  angular.module('ngMockE2E', ['ng']).config([
    '$provide',
    function ($provide) {
      $provide.decorator('$httpBackend', angular.mock.e2e.$httpBackendDecorator);
    }
  ]);
  /**
 * @ngdoc service
 * @name $httpBackend
 * @module ngMockE2E
 * @description
 * Fake HTTP backend implementation suitable for end-to-end testing or backend-less development of
 * applications that use the {@link ng.$http $http service}.
 *
 * *Note*: For fake http backend implementation suitable for unit testing please see
 * {@link ngMock.$httpBackend unit-testing $httpBackend mock}.
 *
 * This implementation can be used to respond with static or dynamic responses via the `when` api
 * and its shortcuts (`whenGET`, `whenPOST`, etc) and optionally pass through requests to the
 * real $httpBackend for specific requests (e.g. to interact with certain remote apis or to fetch
 * templates from a webserver).
 *
 * As opposed to unit-testing, in an end-to-end testing scenario or in scenario when an application
 * is being developed with the real backend api replaced with a mock, it is often desirable for
 * certain category of requests to bypass the mock and issue a real http request (e.g. to fetch
 * templates or static files from the webserver). To configure the backend with this behavior
 * use the `passThrough` request handler of `when` instead of `respond`.
 *
 * Additionally, we don't want to manually have to flush mocked out requests like we do during unit
 * testing. For this reason the e2e $httpBackend automatically flushes mocked out requests
 * automatically, closely simulating the behavior of the XMLHttpRequest object.
 *
 * To setup the application to run with this http backend, you have to create a module that depends
 * on the `ngMockE2E` and your application modules and defines the fake backend:
 *
 * ```js
 *   myAppDev = angular.module('myAppDev', ['myApp', 'ngMockE2E']);
 *   myAppDev.run(function($httpBackend) {
 *     phones = [{name: 'phone1'}, {name: 'phone2'}];
 *
 *     // returns the current list of phones
 *     $httpBackend.whenGET('/phones').respond(phones);
 *
 *     // adds a new phone to the phones array
 *     $httpBackend.whenPOST('/phones').respond(function(method, url, data) {
 *       phones.push(angular.fromJson(data));
 *     });
 *     $httpBackend.whenGET(/^\/templates\//).passThrough();
 *     //...
 *   });
 * ```
 *
 * Afterwards, bootstrap your app with this new module.
 */
  /**
 * @ngdoc method
 * @name $httpBackend#when
 * @module ngMockE2E
 * @description
 * Creates a new backend definition.
 *
 * @param {string} method HTTP method.
 * @param {string|RegExp} url HTTP url.
 * @param {(string|RegExp)=} data HTTP request body.
 * @param {(Object|function(Object))=} headers HTTP headers or function that receives http header
 *   object and returns true if the headers match the current definition.
 * @returns {requestHandler} Returns an object with `respond` and `passThrough` methods that
 *   control how a matched request is handled.
 *
 *  - respond –
 *    `{function([status,] data[, headers])|function(function(method, url, data, headers)}`
 *    – The respond method takes a set of static data to be returned or a function that can return
 *    an array containing response status (number), response data (string) and response headers
 *    (Object).
 *  - passThrough – `{function()}` – Any request matching a backend definition with `passThrough`
 *    handler, will be pass through to the real backend (an XHR request will be made to the
 *    server.
 */
  /**
 * @ngdoc method
 * @name $httpBackend#whenGET
 * @module ngMockE2E
 * @description
 * Creates a new backend definition for GET requests. For more info see `when()`.
 *
 * @param {string|RegExp} url HTTP url.
 * @param {(Object|function(Object))=} headers HTTP headers.
 * @returns {requestHandler} Returns an object with `respond` and `passThrough` methods that
 *   control how a matched request is handled.
 */
  /**
 * @ngdoc method
 * @name $httpBackend#whenHEAD
 * @module ngMockE2E
 * @description
 * Creates a new backend definition for HEAD requests. For more info see `when()`.
 *
 * @param {string|RegExp} url HTTP url.
 * @param {(Object|function(Object))=} headers HTTP headers.
 * @returns {requestHandler} Returns an object with `respond` and `passThrough` methods that
 *   control how a matched request is handled.
 */
  /**
 * @ngdoc method
 * @name $httpBackend#whenDELETE
 * @module ngMockE2E
 * @description
 * Creates a new backend definition for DELETE requests. For more info see `when()`.
 *
 * @param {string|RegExp} url HTTP url.
 * @param {(Object|function(Object))=} headers HTTP headers.
 * @returns {requestHandler} Returns an object with `respond` and `passThrough` methods that
 *   control how a matched request is handled.
 */
  /**
 * @ngdoc method
 * @name $httpBackend#whenPOST
 * @module ngMockE2E
 * @description
 * Creates a new backend definition for POST requests. For more info see `when()`.
 *
 * @param {string|RegExp} url HTTP url.
 * @param {(string|RegExp)=} data HTTP request body.
 * @param {(Object|function(Object))=} headers HTTP headers.
 * @returns {requestHandler} Returns an object with `respond` and `passThrough` methods that
 *   control how a matched request is handled.
 */
  /**
 * @ngdoc method
 * @name $httpBackend#whenPUT
 * @module ngMockE2E
 * @description
 * Creates a new backend definition for PUT requests.  For more info see `when()`.
 *
 * @param {string|RegExp} url HTTP url.
 * @param {(string|RegExp)=} data HTTP request body.
 * @param {(Object|function(Object))=} headers HTTP headers.
 * @returns {requestHandler} Returns an object with `respond` and `passThrough` methods that
 *   control how a matched request is handled.
 */
  /**
 * @ngdoc method
 * @name $httpBackend#whenPATCH
 * @module ngMockE2E
 * @description
 * Creates a new backend definition for PATCH requests.  For more info see `when()`.
 *
 * @param {string|RegExp} url HTTP url.
 * @param {(string|RegExp)=} data HTTP request body.
 * @param {(Object|function(Object))=} headers HTTP headers.
 * @returns {requestHandler} Returns an object with `respond` and `passThrough` methods that
 *   control how a matched request is handled.
 */
  /**
 * @ngdoc method
 * @name $httpBackend#whenJSONP
 * @module ngMockE2E
 * @description
 * Creates a new backend definition for JSONP requests. For more info see `when()`.
 *
 * @param {string|RegExp} url HTTP url.
 * @returns {requestHandler} Returns an object with `respond` and `passThrough` methods that
 *   control how a matched request is handled.
 */
  angular.mock.e2e = {};
  angular.mock.e2e.$httpBackendDecorator = [
    '$rootScope',
    '$delegate',
    '$browser',
    createHttpBackendMock
  ];
  angular.mock.clearDataCache = function () {
    var key, cache = angular.element.cache;
    for (key in cache) {
      if (Object.prototype.hasOwnProperty.call(cache, key)) {
        var handle = cache[key].handle;
        handle && angular.element(handle.elem).off();
        delete cache[key];
      }
    }
  };
  if (window.jasmine || window.mocha) {
    var currentSpec = null, isSpecRunning = function () {
        return !!currentSpec;
      };
    beforeEach(function () {
      currentSpec = this;
    });
    afterEach(function () {
      var injector = currentSpec.$injector;
      currentSpec.$injector = null;
      currentSpec.$modules = null;
      currentSpec = null;
      if (injector) {
        injector.get('$rootElement').off();
        injector.get('$browser').pollFns.length = 0;
      }
      angular.mock.clearDataCache();
      // clean up jquery's fragment cache
      angular.forEach(angular.element.fragments, function (val, key) {
        delete angular.element.fragments[key];
      });
      MockXhr.$$lastInstance = null;
      angular.forEach(angular.callbacks, function (val, key) {
        delete angular.callbacks[key];
      });
      angular.callbacks.counter = 0;
    });
    /**
   * @ngdoc function
   * @name angular.mock.module
   * @description
   *
   * *NOTE*: This function is also published on window for easy access.<br>
   *
   * This function registers a module configuration code. It collects the configuration information
   * which will be used when the injector is created by {@link angular.mock.inject inject}.
   *
   * See {@link angular.mock.inject inject} for usage example
   *
   * @param {...(string|Function|Object)} fns any number of modules which are represented as string
   *        aliases or as anonymous module initialization functions. The modules are used to
   *        configure the injector. The 'ng' and 'ngMock' modules are automatically loaded. If an
   *        object literal is passed they will be register as values in the module, the key being
   *        the module name and the value being what is returned.
   */
    window.module = angular.mock.module = function () {
      var moduleFns = Array.prototype.slice.call(arguments, 0);
      return isSpecRunning() ? workFn() : workFn;
      /////////////////////
      function workFn() {
        if (currentSpec.$injector) {
          throw new Error('Injector already created, can not register a module!');
        } else {
          var modules = currentSpec.$modules || (currentSpec.$modules = []);
          angular.forEach(moduleFns, function (module) {
            if (angular.isObject(module) && !angular.isArray(module)) {
              modules.push(function ($provide) {
                angular.forEach(module, function (value, key) {
                  $provide.value(key, value);
                });
              });
            } else {
              modules.push(module);
            }
          });
        }
      }
    };
    /**
   * @ngdoc function
   * @name angular.mock.inject
   * @description
   *
   * *NOTE*: This function is also published on window for easy access.<br>
   *
   * The inject function wraps a function into an injectable function. The inject() creates new
   * instance of {@link auto.$injector $injector} per test, which is then used for
   * resolving references.
   *
   *
   * ## Resolving References (Underscore Wrapping)
   * Often, we would like to inject a reference once, in a `beforeEach()` block and reuse this
   * in multiple `it()` clauses. To be able to do this we must assign the reference to a variable
   * that is declared in the scope of the `describe()` block. Since we would, most likely, want
   * the variable to have the same name of the reference we have a problem, since the parameter
   * to the `inject()` function would hide the outer variable.
   *
   * To help with this, the injected parameters can, optionally, be enclosed with underscores.
   * These are ignored by the injector when the reference name is resolved.
   *
   * For example, the parameter `_myService_` would be resolved as the reference `myService`.
   * Since it is available in the function body as _myService_, we can then assign it to a variable
   * defined in an outer scope.
   *
   * ```
   * // Defined out reference variable outside
   * var myService;
   *
   * // Wrap the parameter in underscores
   * beforeEach( inject( function(_myService_){
   *   myService = _myService_;
   * }));
   *
   * // Use myService in a series of tests.
   * it('makes use of myService', function() {
   *   myService.doStuff();
   * });
   *
   * ```
   *
   * See also {@link angular.mock.module angular.mock.module}
   *
   * ## Example
   * Example of what a typical jasmine tests looks like with the inject method.
   * ```js
   *
   *   angular.module('myApplicationModule', [])
   *       .value('mode', 'app')
   *       .value('version', 'v1.0.1');
   *
   *
   *   describe('MyApp', function() {
   *
   *     // You need to load modules that you want to test,
   *     // it loads only the "ng" module by default.
   *     beforeEach(module('myApplicationModule'));
   *
   *
   *     // inject() is used to inject arguments of all given functions
   *     it('should provide a version', inject(function(mode, version) {
   *       expect(version).toEqual('v1.0.1');
   *       expect(mode).toEqual('app');
   *     }));
   *
   *
   *     // The inject and module method can also be used inside of the it or beforeEach
   *     it('should override a version and test the new version is injected', function() {
   *       // module() takes functions or strings (module aliases)
   *       module(function($provide) {
   *         $provide.value('version', 'overridden'); // override version here
   *       });
   *
   *       inject(function(version) {
   *         expect(version).toEqual('overridden');
   *       });
   *     });
   *   });
   *
   * ```
   *
   * @param {...Function} fns any number of functions which will be injected using the injector.
   */
    var ErrorAddingDeclarationLocationStack = function (e, errorForStack) {
      this.message = e.message;
      this.name = e.name;
      if (e.line)
        this.line = e.line;
      if (e.sourceId)
        this.sourceId = e.sourceId;
      if (e.stack && errorForStack)
        this.stack = e.stack + '\n' + errorForStack.stack;
      if (e.stackArray)
        this.stackArray = e.stackArray;
    };
    ErrorAddingDeclarationLocationStack.prototype.toString = Error.prototype.toString;
    window.inject = angular.mock.inject = function () {
      var blockFns = Array.prototype.slice.call(arguments, 0);
      var errorForStack = new Error('Declaration Location');
      return isSpecRunning() ? workFn.call(currentSpec) : workFn;
      /////////////////////
      function workFn() {
        var modules = currentSpec.$modules || [];
        modules.unshift('ngMock');
        modules.unshift('ng');
        var injector = currentSpec.$injector;
        if (!injector) {
          injector = currentSpec.$injector = angular.injector(modules);
        }
        for (var i = 0, ii = blockFns.length; i < ii; i++) {
          try {
            /* jshint -W040 */
            /* Jasmine explicitly provides a `this` object when calling functions */
            injector.invoke(blockFns[i] || angular.noop, this);  /* jshint +W040 */
          } catch (e) {
            if (e.stack && errorForStack) {
              throw new ErrorAddingDeclarationLocationStack(e, errorForStack);
            }
            throw e;
          } finally {
            errorForStack = null;
          }
        }
      }
    };
  }
}(window, window.angular));
define('angularMocks', function () {
});
/* globals angular:false */
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