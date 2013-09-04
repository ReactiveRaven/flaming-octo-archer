define(['angular', 'jquery', 'CornerCouch'], function (angular, jquery) {
    "use strict";
    
    var CouchModule = angular.module('commissar.services.Couch', ['CornerCouch']);
    
    CouchModule.factory('Couch', function ($rootScope, cornercouch, $q) {
        if (!$rootScope.cornercouch) {
            $rootScope.cornercouch = cornercouch("/couchdb", "GET");
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
                                    throw ({forbidden: 'All documents must have a type'});
                                }
                                if (userCtx.db !== 'commissar_user_' + userCtx.name && userCtx.roles.indexOf('_admin') === -1) {
                                    throw ({forbidden: 'Cannot alter documents outside your own database'});
                                }
                                if (typeof newDoc.created !== 'undefined') {
                                    if (String(parseInt(newDoc.created, 10)) !== String(newDoc.created)) {
                                        throw ({forbidden: 'Created timestamp must be in unix format'});
                                    }
                                    if (oldDoc && typeof oldDoc.created !== 'undefined' && newDoc.created !== oldDoc.created) {
                                        throw ({forbidden: 'Cannot alter created timestamp once set'});
                                    }
                                }
                                if (typeof newDoc.updated !== 'undefined' && String(parseInt(newDoc.updated, 10)) !== String(newDoc.updated)) {
                                    throw ({forbidden: 'Updated timestamp must be in unix format'});
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
                                throw ({forbidden: 'Cannot create a document without an author field'});
                            }
                            if (newDoc.author !== userCtx.name && userCtx.roles.indexOf('_admin') === -1) {
                                throw ({forbidden: 'Cannot forge authorship as another user'});
                            }
                            if (newDoc._id.indexOf(userCtx.name) !== 0) {
                                throw ({forbidden: 'IDs must start with your username'});
                            }
                            if (!!oldDoc) {
                                if (typeof oldDoc.type !== 'undefined' && newDoc.type !== oldDoc.type) {
                                    throw ({forbidden: 'Cannot change the type of a document'});
                                }
                                if (typeof oldDoc.author !== 'undefined' && newDoc.author !== oldDoc.author) {
                                    throw ({forbidden: 'Cannot change the author of a document'});
                                }
                            }
                        }
                    },
                    '_design/validation_user_media': {
                        _id: '_design/validation_user_media',
                        language: 'javascript',
                        validate_doc_update: function (newDoc/** /, oldDoc, userCtx/**/) {
                            if (newDoc.type === 'media') {
                                if (typeof newDoc.title === 'undefined') {
                                    throw ({forbidden: 'Media must have a title'});
                                }
                                if (typeof newDoc.created === 'undefined') {
                                    throw ({forbidden: 'Media must have a created timestamp'});
                                }
                            }
                        }
                    }
                }
            },
            pushDesignDocs: function () {
                var deferred = $q.defer();
        
                try
                {
                Couch.getSession().then(function (session) {
                    if (session.roles.indexOf('_admin') === -1) {
                        throw ('Cannot push design documents as you are not an admin');
                    }
                    
                    var remoteDocs = [];
                    
                    for (var databaseName in Couch._designDocs) {
                        console.log(databaseName);
                        if (Couch._designDocs.hasOwnProperty(databaseName)) {
                            var database = Couch._designDocs[databaseName];
                            var couchDatabase = $rootScope.cornercouch.getDB(databaseName);
                            for (var id in database) {
                                if (database.hasOwnProperty(id)) {
                                    var deepCopy = true;
                                    var document = jquery.extend(deepCopy, {}, database[id]);
                                    console.log(id);
                                    for (var property in document) {
                                        if (document.hasOwnProperty(property) && typeof document[property] === 'function') {
                                            document[property] = '' + document[property];
                                        }
                                    }
                                    
                                    var remoteDoc = couchDatabase.newDoc();
                                    remoteDoc.load(id).then(function (data) {
                                        console.log(data);
                                    });
                                }
                            }
                        }
                    }
                    
                    return $q.all(remoteDocs).promise;
                    
                }).then(function (result) {
                    deferred.resolve(result);
                }, function (reject) {
                    deferred.reject(reject);
                });
                } catch (e) {
                    console.log(e);
                    deferred.reject(e);
                }
                
                return deferred.promise;
            },
            validateDoc: function (newDoc, oldDoc, database) {
                var deferred = $q.defer(),
                    viewDocs = Couch._designDocs;
            
                Couch.getSession().then(function (session) {
                    
                    var userCtx,
                        docId,
                        doc;
                    
                    userCtx = jquery.extend({}, session);
                    userCtx.db = database;
                    
                    try
                    {
                        if (database.indexOf("commissar_user") === 0) {
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
                        
                    }
                    catch (error) {
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
                    $rootScope.cornercouch.session().then(function (response) {
                        deferred.resolve(response.userCtx);
                    }, function (reason) {
                        deferred.reject(reason);
                    });
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
            }
        };

        return Couch;
    });
    
    
    return CouchModule;
    
});