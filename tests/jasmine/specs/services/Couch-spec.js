/* global afterEach:false, inject:false */

define(['world', 'jquery'], function (world, jquery) {
    "use strict";
    
    world.shut_up_jshint = true;

    describe('[commissar.services.Couch]', function () {

        var $httpBackend;

        beforeEach(function () {
            module('commissar.services.Couch');
            inject(function (_$httpBackend_) {
                $httpBackend = _$httpBackend_;
            });
        });

        afterEach(function () {
            $httpBackend.verifyNoOutstandingExpectation();
            $httpBackend.verifyNoOutstandingRequest();
        });

        describe('[constructor]', function () {

            it('should not make unnecessary requests', function () {
                // no flush!
            });

            it('should return an object', inject(function (Couch) {
                expect(Couch).toBeDefined();
                expect(typeof Couch).toEqual('object');
            }));
            
            it('should create an instance of cornercouch on rootscope', inject(function (Couch, $rootScope) {
                Couch.shut_up_jshint = true;
                expect($rootScope.cornercouch).toBeDefined();
            }));
            
            it('should not overwrite an existing value in rootscope', inject(function ($rootScope) {
                var value = {some_value: "to test"};
                $rootScope.cornercouch = value;
                
                inject(function (Couch) {
                    Couch.shut_up_jshint = true;
                    expect($rootScope.cornercouch).toBe(value);
                });
            }));

        });

        describe('[functions]', function () {
            beforeEach(function () {

                $httpBackend.whenGET(
                    '/couchdb/_session'
                ).respond(
                    200,
                    {
                        ok: true,
                        userCtx: {name: 'john', roles: ['user']},
                        info: {authentication_db: '_users', authentication_handlers: ['oauth', 'cookie', 'default']}
                    }
                );
            });

            describe('[databaseExists()]', function () {
                
                beforeEach(inject(function ($rootScope, Couch) {
                    Couch.shut_up_jshint = true;
                    
                    $rootScope.cornercouch.databases = [
                        '_replicator', '_users', 'commissar',
                        'commissar_user_fish',
                        'commissar_user_geraldine',
                        'commissar_validation_global',
                        'commissar_validation_users'
                    ];
                }));

                it('should be a function', inject(function (Couch) {
                    world.shouldBeAFunction(Couch, 'databaseExists');
                }));
                
                it('should return a promise', inject(function (Couch) {
                    var response = Couch.databaseExists('_users');
                    
                    expect(response).toBeDefined();
                    expect(typeof response.then).toEqual('function');
                }));

                it('should return true if the database exists', inject(function (Couch) {
                    var response;
                    Couch.databaseExists('_users').then(function (resp) {
                        response = resp;
                    });
                    world.digest();
                    expect(response).toEqual(true);
                    Couch.databaseExists('commissar_validation_users').then(function (resp) {
                        response = resp;
                    });
                    world.digest();
                    expect(response).toEqual(true);
                    
                }));

                it('should return false if the database doesn\'nt exist', inject(function ($rootScope, Couch) {
                    
                    var response;
                    Couch.databaseExists('aghiuaehgiearg').then(function (resp) {
                        response = resp;
                    });
                    world.digest();
                    expect(response).toEqual(false);
                    Couch.databaseExists('missingno').then(function (resp) {
                        response = resp;
                    });
                    
                    expect(response).toEqual(false);
                }));
                
                it('should fetch the databases if not already downloaded', inject(function ($rootScope, Couch) {
                    var oldDatabases = $rootScope.cornercouch.databases,
                        response = null;
                    delete $rootScope.cornercouch.databases;
                    spyOn($rootScope.cornercouch, 'getDatabases').andCallFake(function () {
                        $rootScope.cornercouch.databases = oldDatabases;
                        return world.resolved(oldDatabases);
                    });
                    
                    Couch.databaseExists('_users').then(function (resp) {
                        response = resp;
                    });
                    
                    world.digest();
                    
                    expect($rootScope.cornercouch.getDatabases).toHaveBeenCalled();
                    expect(response).toBe(true);
                }));

            });
            
            describe('[getSession()]', function () {
                
                var ctx = {name: 'john', roles: ['user']};
                
                beforeEach(inject(function ($rootScope, Couch) {
                    Couch.shut_up_jshint = true;
                    
                    spyOn(
                        $rootScope.cornercouch,
                        'session'
                    ).andReturn(
                        world.resolved({
                            ok: true,
                            userCtx: ctx,
                            info: {authentication_db: '_users', authentication_handlers: ['oauth', 'cookie', 'default']}
                        })
                    );
                }));
                
                it('should be a function', inject(function (Couch) {
                    world.shouldBeAFunction(Couch, 'getSession');
                }));
                
                it('should return a promise', inject(function ($rootScope, Couch) {
                    var response = Couch.getSession();
                    world.digest();
                    
                    expect(typeof response).not.toEqual('undefined');
                    expect(typeof response.then).toEqual('function');
                }));
                
                it('should check the server for the current session', inject(function (Couch, $rootScope) {
                    Couch.getSession();
                    
                    world.digest();
                    
                    expect($rootScope.cornercouch.session).toHaveBeenCalled();
                }));
                
                it('should skip checking the server if the session is already loaded', inject(function (Couch, $rootScope) {
                    $rootScope.cornercouch.userCtx = {name: null, roles: []};
                    
                    Couch.getSession();
                    
                    expect($rootScope.cornercouch.session).not.toHaveBeenCalled();
                }));
                
                it('should return the session it received from the server', inject(function (Couch) {
                    var response = null;
                    
                    Couch.getSession().then(function (_response_) { response = _response_; });
                    
                    world.digest();
                    
                    expect(response).toBe(ctx);
                }));
                
                it('should reject when the server complains', inject(function (Couch, $rootScope) {
                    var reason = 'a reason',
                        response = null;
                    $rootScope.cornercouch.session.andReturn(world.rejected(reason));
                    
                    Couch.getSession().then(function () { }, function (resp) {
                        response = resp;
                    });
                    
                    world.digest();
                    
                    expect(response).toBe(reason);
                    
                }));
                
            });
            
            describe('[login()]', function () {
                it('should be a function', inject(function (Couch) {
                    world.shouldBeAFunction(Couch, 'login');
                }));
                
                it('should return a promise', inject(function ($rootScope, Couch) {
                    spyOn($rootScope.cornercouch, 'login').andReturn(world.resolved(null));
                    var response = Couch.login();
                    
                    expect(typeof response).not.toEqual('undefined');
                    expect(typeof response.then).toEqual('function');
                }));
                
                it('should call through to cornercouch', inject(function ($rootScope, Couch) {
                    spyOn($rootScope.cornercouch, 'login').andReturn(world.resolved(true));
                    
                    Couch.login('john', 'password');
                    
                    expect($rootScope.cornercouch.login).toHaveBeenCalledWith('john', 'password');
                }));
                
                it('should return true if the login succeeded', inject(function ($rootScope, Couch) {
                    spyOn($rootScope.cornercouch, 'login').andReturn(world.resolved(null));
                    
                    var response = null;
                    
                    Couch.login('john', 'password').then(function (r) {
                        response = r;
                    });
                    
                    world.digest();
                    
                    expect(response).toEqual(true);
                }));
                
                it('should return false if the login failed', inject(function ($rootScope, Couch) {
                    spyOn($rootScope.cornercouch, 'login').andReturn(world.rejected(null));
                    
                    var response = null;
                    
                    Couch.login('john', 'password').then(function (_response_) {
                        response = _response_;
                    });
                    
                    world.digest();
                    
                    expect(response).toEqual(false);
                }));
            });
            
            describe('[validateDoc()]', function () {
                
                var $rootScope,
                    exampleDoc = {
                        _id: 12345,
                        type: 'test'
                    };
                
                beforeEach(inject(function (_$rootScope_) {
                    $rootScope = _$rootScope_;
                    $rootScope.cornercouch = {
                        userCtx: {
                            name: 'john',
                            roles: []
                        }
                    };
                }));
                
                "zzyaayyybbyzzc";
                
                it('should be a function', inject(function (Couch) {
                    world.shouldBeAFunction(Couch, 'validateDoc');
                }));
                
                it('should return a promise', inject(function (Couch) {
                    var returned = Couch.validateDoc(exampleDoc, null, 'commissar_public');
                    
                    expect(typeof returned.then).toBe('function');
                }));
                
                it('should check global functions always', inject(function (Couch) {
                    Couch._designDocs.global = {
                        'mock': {
                            _id: 'mock',
                            _rev: '12345',
                            language: 'javascript',
                            validate_doc_update: function () {
                                // noop
                            }
                        }
                    };
                    spyOn(Couch._designDocs.global.mock, 'validate_doc_update').andReturn(true);
                    
                    Couch.validateDoc(exampleDoc, null, 'commissar_public');
                    
                    world.digest();
                    
                    expect(Couch._designDocs.global.mock.validate_doc_update).toHaveBeenCalled();
                    
                }));
                
                it('should check user functions only on user databases', inject(function (Couch) {
                    Couch._designDocs.user = {
                        'mock': {
                            _id: 'mock',
                            _rev: '12345',
                            language: 'javascript',
                            validate_doc_update: function () {
                                // noop
                            }
                        }
                    };
                    spyOn(Couch._designDocs.user.mock, 'validate_doc_update').andReturn(true);
                    
                    Couch.validateDoc(exampleDoc, null, 'commissar_public');
                    
                    world.digest();
                    
                    expect(Couch._designDocs.user.mock.validate_doc_update).not.toHaveBeenCalled();
                    
                    Couch.validateDoc({
                        _id: 12345,
                        type: 'test'
                    }, null, 'commissar_user_john');
                    
                    world.digest();
                    
                    expect(Couch._designDocs.user.mock.validate_doc_update).toHaveBeenCalled();
                }));
                
                it('should reject if it cannot find a session', function () {
                    delete $rootScope.cornercouch;
                    
                    var failureReason = 'testing- no db available!';
                    
                    inject(function (Couch) {
                        spyOn($rootScope.cornercouch, 'session').andReturn(world.rejected(failureReason));
                        
                        var success,
                            failure;
                        
                        Couch.validateDoc(exampleDoc, null, 'commissar_public').then(function (_success_) {
                            success = _success_;
                        }, function (_failure_) {
                            failure = _failure_;
                        });
                        
                        world.digest();
                        
                        expect(success).not.toBeDefined();
                        expect(failure).toBe(failureReason);
                    });
                });
                
                it('should return the first error found', inject(function (Couch) {
                    var rejection = {forbidden: 'testing'},
                        success,
                        failure;
                    
                    Couch._designDocs.global = {
                        'mock': {
                            _id: 'mock',
                            _rev: '12345',
                            language: 'javascript',
                            validate_doc_update: function () {
                                throw (rejection);
                            }
                        }
                    };

                    Couch.validateDoc(exampleDoc, null, 'commissar_public').then(function (_success_) {
                        success = _success_;
                    }, function (_failure_) {
                        failure = _failure_;
                    });

                    world.digest();

                    expect(success).not.toBeDefined();
                    expect(failure).toBe(rejection.forbidden);
                }));
                
                it('should resolve if no errors found', inject(function (Couch) {
                    Couch._designDocs.global = {
                        'mock': {
                            _id: 'mock',
                            _rev: '12345',
                            language: 'javascript',
                            validate_doc_update: function () {
                            }
                        }
                    };
                    
                    var success, failure;
                    
                    Couch.validateDoc(exampleDoc, null, 'commissar_public').then(function (_success_) {
                        success = _success_;
                    }, function (_failure_) {
                        failure = _failure_;
                    });

                    world.digest();

                    expect(success).toBe(true);
                    expect(failure).not.toBeDefined();
                }));
                
                it('should not fail if a document doesn\'t have a validate_doc_update function', inject(function (Couch) {
                    Couch._designDocs.global = {
                        'mock': {
                            _id: 'mock',
                            _rev: '12345',
                            language: 'javascript'
                        }
                    };
                    Couch._designDocs.user = {
                        'mock': {
                            _id: 'mock',
                            _rev: '12345',
                            language: 'javascript'
                        }
                    };
                    
                    var success, failure;
                    
                    Couch.validateDoc(exampleDoc, null, 'commissar_user_john').then(function (_success_) {
                        success = _success_;
                    }, function (_failure_) {
                        failure = _failure_;
                    });

                    world.digest();

                    expect(success).toBe(true);
                    expect(failure).not.toBeDefined();
                }));
                
                it('should pass unexpected exceptions upwards', inject(function (Couch) {
                    
                    var unexpectedException = {unexpected_exception: true};
                    
                    Couch._designDocs.global = {
                        'mock': {
                            _id: 'mock',
                            _rev: '12345',
                            language: 'javascript',
                            validate_doc_update: function () {
                                throw unexpectedException;
                            }
                        }
                    };
                    Couch._designDocs.user = {
                        'mock': {
                            _id: 'mock',
                            _rev: '12345',
                            language: 'javascript'
                        }
                    };
                    
                    expect(function () {
                        Couch.validateDoc(null, null, 'commissar_public');
                        world.digest();
                    }).toThrow(unexpectedException);
                    
                }));
            });
        });
        
        describe('[viewDocs]', function () {
            
            var $rootScope,
                validDocument = {
                    _id: 'john_123',
                    type: 'some_type',
                    author: 'john'
                },
                globalDb = 'commissar_public',
                userDb = 'commissar_user_john',
                testValidate = function (newDoc, oldDoc, db, resolve, reject) {
                    
                    var success,
                        failure;
                
                    var functions = {
                            'success': function (_success_) {
                                success = _success_;
                            },
                            'failure': function (_failure_) {
                                failure = _failure_;
                            }
                        };
                        
                    spyOn(functions, 'success').andCallThrough();
                    spyOn(functions, 'failure').andCallThrough();
                    
                    inject(function (Couch) {
                        Couch.validateDoc(newDoc, oldDoc, db).then(functions.success, functions.failure);
                    });
                    
                    world.digest();
                    
                    var calls = functions.success.callCount + functions.failure.callCount;

                    expect(calls).toBeGreaterThan(0);
                    expect(success).toBe(resolve);
                    expect(failure).toBe(reject);
                };
            
            beforeEach(inject(function (_$rootScope_) {
                $rootScope = _$rootScope_;
                $rootScope.cornercouch = {
                    userCtx: {
                        name: 'john',
                        roles: []
                    }
                };
            }));
            
            it('should have a key containing expected view documents', inject(function (Couch) {
                expect(Couch._designDocs).toBeDefined();
            }));
            
            describe('[global]', function () {
                it('should have keys for global view documents', inject(function (Couch) {
                    expect(Couch._designDocs.global).toBeDefined();
                }));
                
                it('should reject documents without a type', function () {
                    var noType = jquery.extend({}, validDocument);
                    delete noType.type;
                    
                    testValidate(noType, null, globalDb, undefined, 'All documents must have a type');
                });
                
                it('should allow deleted documents', function () {
                    var deleted = {
                        '_id': validDocument['_id'],
                        '_deleted': true
                    };
                    
                    testValidate(deleted, validDocument, globalDb, true, undefined);
                });
                
                it('should not allow writes outside your own db unless admin', inject(function ($rootScope) {
                    testValidate(validDocument, null, globalDb, undefined, 'Cannot alter documents outside your own database');
                    $rootScope.cornercouch.userCtx.roles = ['_admin'];
                    testValidate(validDocument, null, globalDb, true, undefined);
                }));
                               
                it('should reject created timestamp in anything but unix timestamp', function () {
                    var badCreated = jquery.extend({}, validDocument);
                    badCreated.created = "2000-01-01 00:00:00";
                    testValidate(badCreated, null, userDb, undefined, 'Created timestamp must be in unix format');
                });
                
                it('should reject when changing created time unless admin', function () {
                    var firstCreated = jquery.extend({}, validDocument);
                    firstCreated.created = "12345";
                    var secondCreated = jquery.extend({}, validDocument);
                    secondCreated.created = "12346";
                    testValidate(secondCreated, firstCreated, userDb, undefined, 'Cannot alter created timestamp once set');
                });
                                    
                it('should reject updated timestamp in anything but unix timestamp', function () {
                    var badUpdated = jquery.extend({}, validDocument);
                    badUpdated.updated = "2000-01-01 00:00:00";
                    testValidate(badUpdated, null, userDb, undefined, 'Updated timestamp must be in unix format');
                });
            });
            
            describe('[user]', function () {
                it('should have keys for user view documents', inject(function (Couch) {
                    expect(Couch._designDocs.user).toBeDefined();
                }));
                
                it('should require an author field in your db', function () {
                    var noAuthor = jquery.extend({}, validDocument);
                    delete noAuthor.author;
                    
                    testValidate(noAuthor, null, userDb, undefined, 'Cannot create a document without an author field');
                });
                
                it('should require author to match own name, unless admin', function () {
                    var yours = jquery.extend({}, validDocument);
                    yours.author = 'susan';
                    testValidate(yours, null, userDb, undefined, 'Cannot forge authorship as another user');
                });
                
                it('should require ids start with username', function () {
                    var badId = jquery.extend({}, validDocument);
                    badId['_id'] = 'gibberish';
                    testValidate(badId, null, userDb, undefined, 'IDs must start with your username');
                });
                
                it('should reject changing the type field', function () {
                    var typeChanged = jquery.extend({}, validDocument);
                    typeChanged.type = 'newType';
                    testValidate(typeChanged, validDocument, userDb, undefined, 'Cannot change the type of a document');
                });
                
                it('should reject changing the author field', function () {
                    var susansDocument = jquery.extend({}, validDocument);
                    susansDocument.author = 'susan';
                    testValidate(validDocument, susansDocument, userDb, undefined, 'Cannot change the author of a document');
                });
                
                it('should accept well-formed documents', function () {
                    testValidate(validDocument, null, userDb, true, undefined);
                    testValidate(validDocument, validDocument, userDb, true, undefined);
                });
                
                describe('[media]', function () {
                    
                    var validDocument = {
                        _id: 'john_123',
                        type: 'media',
                        author: 'john',
                        title: 'Mona Lisa',
                        created: '1378005326'
                    };
                    
                    it('should require a title and author', function () {
                        testValidate(validDocument, null, userDb, true, undefined);
                        var noTitle = jquery.extend({}, validDocument);
                        delete noTitle.title;
                        testValidate(noTitle, null, userDb, undefined, 'Media must have a title');
                        var noAuthor = jquery.extend({}, validDocument);
                        delete noAuthor.author;
                        testValidate(noAuthor, null, userDb, undefined, 'Cannot create a document without an author field');
                    });
                    
                    it('should require created timestamp', function () {
                        var noCreated = jquery.extend({}, validDocument);
                        delete noCreated.created;
                        testValidate(noCreated, null, userDb, undefined, 'Media must have a created timestamp');
                    });
                });
            });
        });

    });
    
});