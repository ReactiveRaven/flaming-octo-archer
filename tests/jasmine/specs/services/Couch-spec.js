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
                
                var ctx,
                    template,
                    $rootScope;
                
                beforeEach(inject(function (_$rootScope_, Couch) {
                    Couch.shut_up_jshint = true;
                    
                    $rootScope = _$rootScope_;
                    
                    ctx = {name: 'john', roles: ['user']};
                    
                    template = {
                        ok: true,
                        userCtx: ctx,
                        info: {authentication_db: '_users', authentication_handlers: ['oauth', 'cookie', 'default']}
                    };
                    
                    template.userCtx = ctx;
                    
                    spyOn($rootScope.cornercouch, 'session').andReturn(world.resolved(template));
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
                    
                    $rootScope.cornercouch.userCtx = ctx;
                    
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
            
            describe('[logout()]', function () {
                var Couch,
                    $rootScope;
                    
                beforeEach(inject(function (_Couch_, _$rootScope_) {
                    Couch = _Couch_;
                    $rootScope = _$rootScope_;
                }));
                
                it('should be a function', function () {
                    world.shouldBeAFunction(Couch, 'logout');
                });
                
                it('should call out to cornercouch', function () {
                    spyOn($rootScope.cornercouch, 'logout');
                    
                    Couch.logout();
                    
                    expect($rootScope.cornercouch.logout).toHaveBeenCalled();
                });
                
                it('should return a promise', function () {
                    spyOn($rootScope.cornercouch, 'logout').andReturn(world.resolved(true));
                    
                    var reply = Couch.logout();
                    
                    expect(reply).toBeDefined();
                    expect(reply.then).toBeDefined();
                    expect(typeof reply.then).toBe("function");
                });
            });
            
            describe('[loggedIn()]', function () {
                
                var Couch,
                    ctx;
                
                beforeEach(inject(function (_Couch_) {
                    Couch = _Couch_;
                    
                    ctx = {'name': 'john', 'roles': ['+admin']};
                    spyOn(Couch, "getSession");
                    Couch.getSession.andReturn(world.resolved(ctx));
                }));
                
                it('should be a function', function () {
                    world.shouldBeAFunction(Couch, 'loggedIn');
                });
                
                it('should return a promise', function () {
                    var response = Couch.loggedIn();
                    expect(typeof response).not.toEqual('undefined');
                    expect(typeof response.then).toEqual('function');
                });
                
                it('should check for an existing cookie', function () {
                    var $cookies;
                        
                    inject(function (_$cookies_) {
                        $cookies = _$cookies_;
                    });
                    
                    $cookies.wasLoggedIn = true;
                    
                    Couch.loggedIn();
                    
                    expect(Couch.getSession).toHaveBeenCalled();
                });
                
                it('should assume logged out if no existing cookie', function () {
                    var $cookies;
                    
                    inject(function (_$cookies_) {
                        $cookies = _$cookies_;
                    });
                    
                    delete $cookies.wasLoggedIn;
                    
                    Couch.loggedIn().then(function (response) {
                        expect(response).toEqual(false);
                    });
                });
                    
                it('should return false when logged out', function () {

                    var response = null;

                    ctx.name = null;

                    Couch.loggedIn().then(function (resp) {
                        response = resp;
                    });

                    world.digest();

                    expect(Couch.getSession).toHaveBeenCalled();
                    expect(response).toEqual(false);
                });

                it('should return true when logged in', function () {

                    var response = null;

                    Couch.loggedIn().then(function (resp) {
                        response = resp;
                    });

                    world.digest();

                    expect(Couch.getSession).toHaveBeenCalled();
                    expect(response).toEqual(true);
                });
                
                it('should handle null input', function () {
                    Couch.getSession.andReturn(world.resolved(null));
                    
                    var success = null,
                        error = null;
                    
                    Couch.loggedIn().then(function (_success_) { success = _success_; }, function (_error_) { error = _error_; });
                    
                    world.digest();
                    
                    expect(success).toBe(false);
                    expect(error).toBe(null);
                });
                
            });
            
            describe('[hasRole()]', function () {
                
                var Couch,
                    ctx;
                
                beforeEach(inject(function (_Couch_) {
                    Couch = _Couch_;
                    
                    spyOn(Couch, 'loggedIn');
                    Couch.loggedIn.andReturn(world.resolved(true));
                    
                    ctx = {'name': 'john', 'roles': ['+admin']};
                    spyOn(Couch, 'getSession');
                    Couch.getSession.andReturn(world.resolved(ctx));
                }));
                
                it('should be a function', inject(function (Couch) {
                    world.shouldBeAFunction(Couch, 'hasRole');
                }));
                
                it('should return a promise', inject(function (Couch) {
                    var response = Couch.hasRole();
                    expect(typeof response).not.toEqual('undefined');
                    expect(typeof response.then).toEqual('function');
                }));
                
                it('should check if logged in', function () {
                    Couch.hasRole("+admin");
                    
                    expect(Couch.loggedIn).toHaveBeenCalled();
                });
                
                it('should assume not when logged out', function () {
                    Couch.loggedIn.andReturn(world.resolved(false));
                    
                    var success = null,
                        error = null;
                    
                    Couch.hasRole("+admin").then(function (_success_) { success = _success_; }, function (_error_) { error = _error_; });
                    
                    world.digest();
                    
                    expect(success).toBe(false);
                    expect(error).toBe(null);
                });
                
                it('should check the session if logged in', function () {
                    Couch.hasRole("+admin");
                    
                    world.digest();
                    
                    expect(Couch.getSession).toHaveBeenCalled();
                });
                
                it('should return true if the current user has the role', function () {
                    var success = null,
                        error = null;
                    
                    Couch.hasRole("+admin").then(function (_success_) { success = _success_; }, function (_error_) { error = _error_; });
                    
                    world.digest();
                    
                    expect(success).toBe(true);
                    expect(error).toBe(null);
                });
                
                it('should return false if the current user does not have the role', function () {
                    var success = null,
                        error = null;
                    
                    Couch.hasRole("+president").then(function (_success_) { success = _success_; }, function (_error_) { error = _error_; });
                    
                    world.digest();
                    
                    expect(success).toBe(false);
                    expect(error).toBe(null);
                });
                
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
                
                it('should be a function', inject(function (Couch) {
                    world.shouldBeAFunction(Couch, 'validateDoc');
                }));
                
                it('should return a promise', inject(function (Couch) {
                    var returned = Couch.validateDoc(exampleDoc, null, 'commissar_public');
                    
                    expect(typeof returned.then).toBe('function');
                }));
                
                it('should check global functions always', inject(function (Couch) {
                    Couch._designDocs.commissar_validation_global = {
                        'mock': {
                            _id: 'mock',
                            _rev: '12345',
                            language: 'javascript',
                            validate_doc_update: function () {
                                // noop
                            }
                        }
                    };
                    spyOn(Couch._designDocs.commissar_validation_global.mock, 'validate_doc_update').andReturn(true);
                    
                    Couch.validateDoc(exampleDoc, null, 'commissar_public');
                    
                    world.digest();
                    
                    expect(Couch._designDocs.commissar_validation_global.mock.validate_doc_update).toHaveBeenCalled();
                    
                }));
                
                it('should check user functions only on user databases', inject(function (Couch) {
                    Couch._designDocs.commissar_validation_users = {
                        'mock': {
                            _id: 'mock',
                            _rev: '12345',
                            language: 'javascript',
                            validate_doc_update: function () {
                                // noop
                            }
                        }
                    };
                    spyOn(Couch._designDocs.commissar_validation_users.mock, 'validate_doc_update').andReturn(true);
                    
                    Couch.validateDoc(exampleDoc, null, 'commissar_public');
                    
                    world.digest();
                    
                    expect(Couch._designDocs.commissar_validation_users.mock.validate_doc_update).not.toHaveBeenCalled();
                    
                    Couch.validateDoc({
                        _id: 12345,
                        type: 'test'
                    }, null, 'commissar_user_john');
                    
                    world.digest();
                    
                    expect(Couch._designDocs.commissar_validation_users.mock.validate_doc_update).toHaveBeenCalled();
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
                    
                    Couch._designDocs.commissar_validation_global = {
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
                    Couch._designDocs.commissar_validation_global = {
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
                    Couch._designDocs.commissar_validation_global = {
                        'mock': {
                            _id: 'mock',
                            _rev: '12345',
                            language: 'javascript'
                        }
                    };
                    Couch._designDocs.commissar_validation_users = {
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
                    
                    Couch._designDocs.commissar_validation_global = {
                        'mock': {
                            _id: 'mock',
                            _rev: '12345',
                            language: 'javascript',
                            validate_doc_update: function () {
                                throw unexpectedException;
                            }
                        }
                    };
                    Couch._designDocs.commissar_validation_users = {
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
            
            describe('[pushDesignDocs()]', function () {
                
                var $rootScope,
                    Couch;
                
                beforeEach(inject(function (_$rootScope_, _Couch_) {
                    
                    Couch = _Couch_;
                    
                    $rootScope = _$rootScope_;
                    $rootScope.cornercouch.userCtx = {
                        name: 'admin',
                        roles: ['+admin']
                    };
                    
                    Couch._designDocs.commissar_validation_global = {
                        'mock': {
                            _id: 'mock',
                            language: 'javascript-global',
                            validate_doc_update: function () {
                                var x = 1,
                                    y = 2,
                                    z;
                                    
                                z = x + y;
                            }
                        }
                    };
                    Couch._designDocs.commissar_validation_users = {
                        'mock': {
                            _id: 'mock',
                            language: 'javascript-users'
                        }
                    };
                }));
                
                it('should be a function', function () {
                    world.shouldBeAFunction(Couch, 'pushDesignDocs');
                });
                
                it('should refuse if the user does not have +admin role', function () {
                    var success = null,
                        failure = null;
                    
                    $rootScope.cornercouch.userCtx.roles = [];
                    
                    Couch.pushDesignDocs().then(function (_success_) {
                        success = _success_;
                    }, function (_failure_) {
                        failure = _failure_;
                    });
                    
                    world.digest();
                    
                    expect(success).toBe(null);
                    expect(failure).toBe('Cannot push design documents as you are not an admin');
                });
                
                it('should return a promise', function () {
                    var response = Couch.pushDesignDocs();

                    expect(response).toBeDefined();
                    expect(response.then).toBeDefined();
                    expect(typeof response.then).toBe('function');
                });

                it('should push all documents', function () {
                    spyOn(Couch, "applyStaticChanges").andReturn(world.resolved(true));

                    Couch.pushDesignDocs();
                    
                    // Give it time to digest...
                    world.digest();

                    expect(Couch.applyStaticChanges).toHaveBeenCalled();
                    expect(Couch.applyStaticChanges.calls.length).toEqual(2, 'number of applyStaticChanges calls');
                    expect(Couch.applyStaticChanges).toHaveBeenCalledWith('commissar_validation_global', Couch._designDocs.commissar_validation_global.mock);
                    expect(Couch.applyStaticChanges).toHaveBeenCalledWith('commissar_validation_users', Couch._designDocs.commissar_validation_users.mock);
                });
                
                it('should reject if any document fails to save', function () {
                    var success = null,
                        failure = null,
                        rejectMessage = "Something went wrong, at least one document failed";
                        
                    spyOn(Couch, "applyStaticChanges").andReturn(world.rejected(rejectMessage));
                    
                    Couch.pushDesignDocs().then(function (_success_) {
                        success = _success_;
                    }, function (_failure_) {
                        failure = _failure_;
                    });
                    
                    // Give it time to digest...
                    world.digest();
                    
                    expect(success).toBe(null);
                    expect(failure).toBe(rejectMessage);
                });
                
            });
            
            describe('[applyStaticChanges()]', function () {
                                    
                var $rootScope,
                    Couch,
                    save;
                
                beforeEach(inject(function (_$rootScope_, _Couch_) {
                    
                    Couch = _Couch_;
                    
                    $rootScope = _$rootScope_;
                    $rootScope.cornercouch.userCtx = {
                        name: 'admin',
                        roles: ['+admin']
                    };
                    
                    Couch._designDocs.commissar_validation_global = {
                        'mock': {
                            _id: 'mock',
                            language: 'javascript-global',
                            validate_doc_update: function () {
                                var x = 1,
                                    y = 2,
                                    z;
                                    
                                z = x + y;
                            }
                        }
                    };
                    Couch._designDocs.commissar_validation_users = {
                        'mock': {
                            _id: 'mock',
                            language: 'javascript-users'
                        }
                    };

                    // Create a spy 'save' function that does nothing
                    save = jasmine.createSpy("saveDocument").andReturn(world.resolved(true));
                }));
                
                it('should be a function', function () {
                    world.shouldBeAFunction(Couch, 'applyStaticChanges');
                });
                
                it('should collapse documents to JSON strings', function () {
                        
                    // Copy out the mocked document and stringify the validate_doc_update function
                    var globalDoc = jquery.extend({}, Couch._designDocs.commissar_validation_global.mock);
                    globalDoc.validate_doc_update = globalDoc.validate_doc_update.toString();

                    // Set up a spy to return the documents when it tries to load them
                    spyOn(Couch, "getDoc").andCallFake(function (dbname, docid) {
                        return world.resolved(jquery.extend({}, Couch._designDocs[dbname][docid], {'save': save}));
                    });

                    // Push it up!
                    Couch.applyStaticChanges("commissar_validation_global", Couch._designDocs.commissar_validation_global.mock);

                    // Give it time to digest
                    world.digest();

                    // Should have tried to load both documents
                    expect(Couch.getDoc).toHaveBeenCalled();
                    expect(Couch.getDoc.calls.length).toEqual(1, "number of getDoc calls");
                    expect(Couch.getDoc).toHaveBeenCalledWith('commissar_validation_global', 'mock');

                    // Should have tried to save the documents out again stringified
                    expect(save).toHaveBeenCalled();
                    expect(save.calls.length).toEqual(1, "number of save calls");
                    expect(world.sortJSON(save.calls[0].object)).toEqual(world.sortJSON(globalDoc));

                });
                
                it('should return a promise', function () {
                        
                    // Copy out the mocked document and stringify the validate_doc_update function
                    var globalDoc = jquery.extend({}, Couch._designDocs.commissar_validation_global.mock);
                    globalDoc.validate_doc_update = globalDoc.validate_doc_update.toString();

                    // Set up a spy to return the documents when it tries to load them
                    spyOn(Couch, "getDoc").andCallFake(function (dbname, docid) {
                        return world.resolved(jquery.extend({}, Couch._designDocs[dbname][docid], {'save': save}));
                    });

                    // Push it up!
                    var reply = Couch.applyStaticChanges("commissar_validation_global", Couch._designDocs.commissar_validation_global.mock);

                    expect(typeof reply.then).toBe('function');

                });

                it('should overwrite properties on existing documents to replace them', function () {
                    var globalDoc = jquery.extend({}, Couch._designDocs.commissar_validation_global.mock);
                    globalDoc.validate_doc_update = globalDoc.validate_doc_update.toString();

                    var existingGlobal = {
                        '_id': 'mock',
                        '_rev': '12345',
                        'squibble': 'blob',
                        'validate_doc_function': "nope",
                        'save': save
                    };

                    var modifiedGlobal = jquery.extend({}, globalDoc, existingGlobal);

                    // Set up a spy to return the documents when it tries to load them
                    spyOn(Couch, "getDoc").andCallFake(function () {
                        return world.resolved(jquery.extend({}, existingGlobal, {'save': save}));
                    });

                    Couch.applyStaticChanges("commissar_validation_global", Couch._designDocs.commissar_validation_global.mock);

                    // Give it time to digest
                    world.digest();

                    // Should have tried to load both documents
                    expect(Couch.getDoc).toHaveBeenCalled();
                    expect(Couch.getDoc.calls.length).toEqual(1, "number of getDoc calls");
                    expect(Couch.getDoc).toHaveBeenCalledWith('commissar_validation_global', 'mock');

                    // Should have tried to save the documents out again stringified
                    expect(save).toHaveBeenCalled();
                    expect(save.calls.length).toEqual(1, "number of save calls");
                    expect(world.sortJSON(save.calls[0].object)).toEqual(world.sortJSON(modifiedGlobal));
                });

                it('should create documents when they are missing on server side', function () {
                    var globalDoc = jquery.extend({}, Couch._designDocs.commissar_validation_global.mock);
                    globalDoc.validate_doc_update = globalDoc.validate_doc_update.toString();

                    // Set up a spy to return the documents when it tries to load them
                    spyOn(Couch, "getDoc").andCallFake(function (dbname, docid) {
                        if (dbname === "commissar_validation_global") {
                            return world.rejected(false);
                        }
                        return world.resolved(jquery.extend({}, Couch._designDocs[dbname][docid], {'save': save}));
                    });
                    // Set up a spy to return a spied new document when created
                    spyOn(Couch, "newDoc").andCallFake(function () {
                        return world.resolved({save: save});
                    });

                    Couch.applyStaticChanges("commissar_validation_global", Couch._designDocs.commissar_validation_global.mock);

                    // Give it time to digest
                    world.digest();

                    // Should have tried to load both documents
                    expect(Couch.getDoc).toHaveBeenCalled();
                    expect(Couch.getDoc.calls.length).toEqual(1, "number of getDoc calls");
                    expect(Couch.getDoc).toHaveBeenCalledWith('commissar_validation_global', 'mock');

                    // Should have created a new document when one not available
                    expect(Couch.newDoc).toHaveBeenCalled();
                    expect(Couch.newDoc.calls.length).toEqual(1, "number of newDoc calls");
                    expect(Couch.newDoc).toHaveBeenCalledWith("commissar_validation_global");

                    // Should have tried to save the documents out again stringified
                    expect(save).toHaveBeenCalled();
                    expect(save.calls.length).toEqual(1, "number of save calls");
                    expect(world.sortJSON(save.calls[0].object)).toEqual(world.sortJSON(world.stringifyMethods(Couch._designDocs.commissar_validation_global.mock)), "global");
                });
                
                it('should resolve when all are completed successfully', function () {
                    var globalDoc = jquery.extend({}, Couch._designDocs.commissar_validation_global.mock);
                    globalDoc.validate_doc_update = globalDoc.validate_doc_update.toString();

                    // Set up a spy to return the documents when it tries to load them
                    spyOn(Couch, "getDoc").andCallFake(function (dbname, docid) {
                        if (dbname === "commissar_validation_global") {
                            return world.rejected(false);
                        }
                        return world.resolved(jquery.extend({}, Couch._designDocs[dbname][docid], {'save': save}));
                    });
                    // Set up a spy to return a spied new document when created
                    spyOn(Couch, "newDoc").andCallFake(function () {
                        return world.resolved({save: save});
                    });
                    
                    var success = null,
                        error = null;

                    Couch.applyStaticChanges("commissar_validation_global", Couch._designDocs.commissar_validation_global.mock).then(
                        function (_success_) { success = _success_; },
                        function (_error_) { error = _error_; }
                    );

                    // Give it time to digest
                    world.digest();

                    // Expect the reply to have been resolved by now
                    expect(success).toBe(true);
                    expect(error).toBe(null);
                });
                
                it('should reject when database is missing', function () {
                    var globalDoc = jquery.extend({}, Couch._designDocs.commissar_validation_global.mock);
                    globalDoc.validate_doc_update = globalDoc.validate_doc_update.toString();

                    // Set up a spy to return the documents when it tries to load them
                    spyOn(Couch, "getDoc").andCallFake(function (dbname, docid) {
                        if (dbname === "commissar_validation_global") {
                            return world.rejected(false);
                        }
                        return world.resolved(jquery.extend({}, Couch._designDocs[dbname][docid], {'save': save}));
                    });
                    // Set up a spy to return a spied new document when created
                    var errormessage = "FAKE: Database does not exist";
                    spyOn(Couch, "newDoc").andCallFake(function (database) {
                        if (database === 'commissar_validation_global') {
                            return world.rejected(errormessage);
                        }
                        return world.resolved({save: save});
                    });
                    
                    var success = null,
                        error = null;

                    Couch.applyStaticChanges("commissar_validation_global", Couch._designDocs.commissar_validation_global.mock).then(
                        function (_success_) { success = _success_; },
                        function (_error_) { error = _error_; }
                    );

                    // Give it time to digest
                    world.digest();

                    // Expect the reply to have been resolved by now
                    expect(success).toBe(null);
                    expect(error).toBe(errormessage);
                });
                
                it('should reject when save fails', function () {
                    var globalDoc = jquery.extend({}, Couch._designDocs.commissar_validation_global.mock);
                    globalDoc.validate_doc_update = globalDoc.validate_doc_update.toString();

                    // Set up a spy to return the documents when it tries to load them
                    var errormessage = "FAKE: cannot save document";
                    save.andReturn(world.rejected(errormessage));
                    spyOn(Couch, "getDoc").andCallFake(function (dbname, docid) {
                        if (dbname === "commissar_validation_global") {
                            return world.rejected(false);
                        }
                        return world.resolved(jquery.extend({}, Couch._designDocs[dbname][docid], {'save': save}));
                    });
                    // Set up a spy to return a spied new document when created
                    spyOn(Couch, "newDoc").andCallFake(function () {
                        return world.resolved({save: save});
                    });
                    
                    var success = null,
                        error = null;

                    Couch.applyStaticChanges("commissar_validation_global", Couch._designDocs.commissar_validation_global.mock).then(
                        function (_success_) { success = _success_; },
                        function (_error_) { error = _error_; }
                    );

                    // Give it time to digest
                    world.digest();

                    // Expect the reply to have been resolved by now
                    expect(success).toBe(null);
                    expect(error).toBe(errormessage);
                });
            });
            
            describe('[stringifyFunctions()]', function () {
                
                var Couch;
                
                beforeEach(inject(function (_Couch_) {
                    Couch = _Couch_;
                }));
                
                it('should exist', function () {
                    expect(Couch.stringifyFunctions).toBeDefined();
                });
                
                it('should be a function', function () {
                    world.shouldBeAFunction(Couch, 'stringifyFunctions');
                });
                
                it('should stringify functions as properties of an object', function () {
                    var object = {
                        a: function () {
                            "hello";
                        }
                    };
                    
                    object = jquery.extend({}, object);
                    
                    var response = Couch.stringifyFunctions(object);
                    
                    expect(response).toBe(object);
                    expect(typeof response.a).toBe("string");
                });
                
                it("should stringify functions deeply", function () {
                    var object = {
                        a: {
                            b: function () {
                                "hello";
                            }
                        },
                        x: "string"
                    };
                   
                    var response = Couch.stringifyFunctions(object);
                   
                    expect(response).toBe(object);
                    expect(typeof response.a.b).toBe("string");
                });
                
                it("should ignore inherited properties", function () {
                    var prototype = {
                        c: function () {
                            "hello";
                        }
                    };
                    function obj(proto) {
                        function F() {}
                        F.prototype = proto;
                        return new F();
                    }
                    var object = obj(prototype);
                    object.a = function () {
                        "hello";
                    };
                    
                    var response = Couch.stringifyFunctions(object);
                    
                    expect(response).toBe(object);
                    expect(typeof response.a).toBe("string");
                    expect(typeof response.c).toBe("function");
                });
            });
            
            describe('[newDoc()]', function () {
                
                var Couch,
                    $rootScope,
                    fakeDB,
                    fakeDoc;
                
                beforeEach(inject(function (_Couch_, _$rootScope_) {
                    Couch = _Couch_;
                    
                    $rootScope = _$rootScope_;
                    
                    fakeDB = {
                        newDoc: function () {},
                        getDoc: function () {}
                    };
                    
                    fakeDoc = {
                        load: function () {},
                        save: function () {}
                    };
                    
                    world.spyOnAllFunctions(fakeDB);
                    world.spyOnAllFunctions(fakeDoc);
                    
                    fakeDB.newDoc.andReturn(fakeDoc);
                    var resolved = world.resolved({_id: 'mock', type: 'test_document'});
                    resolved.success = function (func) { resolved.then(func); return resolved; };
                    resolved.failure = function () { return resolved; }; // do nothing!
                    
                    fakeDoc.load.andReturn(resolved);
                    
                    spyOn($rootScope.cornercouch, 'getDB').andReturn(fakeDB);
                    
                    spyOn(Couch, 'databaseExists').andReturn(world.resolved(true));
                }));
                
                it('should be a function', function () {
                    world.shouldBeAFunction(Couch, 'newDoc');
                });
                
                it('should return a promise', function () {
                    var returned = Couch.newDoc('database');
                    
                    expect(returned).toBeDefined();
                    expect(typeof returned.then).toBe('function');
                });
                
                it('should reject when the database doesn\'t exist', function () {
                    var database = 'commissar_validation_global',
                        success = null,
                        failure = null;
                        
                    Couch.databaseExists.andReturn(world.resolved(false));
                    
                    Couch.newDoc(database).then(function (_success_) { success = _success_; }, function (_failure_) { failure = _failure_; });
                    world.digest();
                    
                    expect(success).toBe(null);
                    expect(failure).toBe('Database not found: ' + database);
                });
                
                it('should return a CouchDoc object via promise', function () {
                    var database = 'commissar_validation_global',
                        success = null,
                        failure = null;
                        
                    Couch.databaseExists.andReturn(world.resolved(true));
                    
                    Couch.newDoc(database).then(function (_success_) { success = _success_; }, function (_failure_) { failure = _failure_; });
                    world.digest();
                    
                    expect(success).not.toBe(null);
                    expect(failure).toBe(null);
                    expect(typeof success).toBe("object");
                    expect(typeof success.save).toBe("function");
                    expect(typeof success.load).toBe("function");
                });
            });
            
            describe('[getDoc()]', function () {
                
                var Couch,
                    $rootScope,
                    fakeDB,
                    fakeDoc;
                
                beforeEach(inject(function (_Couch_, _$rootScope_) {
                    Couch = _Couch_;
                    
                    $rootScope = _$rootScope_;
                    
                    fakeDB = {
                        newDoc: function () {},
                        getDoc: function () {}
                    };
                    
                    fakeDoc = {
                        load: function () {},
                        save: function () {}
                    };
                    
                    world.spyOnAllFunctions(fakeDB);
                    world.spyOnAllFunctions(fakeDoc);
                    
                    fakeDB.newDoc.andReturn(fakeDoc);
                    var resolved = world.resolved({_id: 'mock', type: 'test_document'});
                    resolved.success = function (func) { resolved.then(func); return resolved; };
                    resolved.error = function (func) { resolved.then(function () {}, func); return resolved; };
                    
                    fakeDoc.load.andReturn(resolved);
                    
                    spyOn($rootScope.cornercouch, 'getDB').andReturn(fakeDB);
                    
                    spyOn(Couch, 'databaseExists').andReturn(world.resolved(true));
                }));
                
                it('should be a function', function () {
                    world.shouldBeAFunction(Couch, 'getDoc');
                });
                
                it('should return a promise', function () {
                    var returned = Couch.getDoc('database', 'id');
                    
                    expect(returned).toBeDefined();
                    expect(typeof returned.then).toBe('function');
                });
                
                it('should not use getDoc because it can\'t be chained properly', function () {
                    Couch.getDoc('mock');
                    
                    expect(fakeDB.getDoc).not.toHaveBeenCalled();
                });
                
                it('should attempt to load the document by it\'s database and id', function () {
                    var database = 'commissar_validation_global',
                        id = 'mock';
                    
                    Couch.getDoc('commissar_validation_global', 'mock');
                    world.digest();
                    
                    expect($rootScope.cornercouch.getDB).toHaveBeenCalledWith(database);
                    expect(fakeDB.newDoc).toHaveBeenCalled();
                    expect(fakeDoc.load).toHaveBeenCalledWith(id);
                });
                
                it('should reject when the database doesn\'t exist', function () {
                    var database = 'commissar_validation_global',
                        id = 'mock',
                        success = null,
                        error = null;
                        
                    Couch.databaseExists.andReturn(world.resolved(false));
                    
                    Couch.getDoc(database, id).then(function (_success_) { success = _success_; }, function (_error_) { error = _error_; });
                    world.digest();
                    
                    expect(success).toBe(null);
                    expect(error).toBe('Database not found: ' + database);
                });
                
                it('should return the document', function () {
                    
                    var success = null,
                        error = null;
                    
                    Couch.getDoc('commissar_validation_global', 'mock').then(function (_success_) { success = _success_; }, function (_error_) { error = _error_; });
                    world.digest();
                    
                    expect(success).toBe(fakeDoc);
                    expect(error).toBe(null);
                });
            });
            
            describe('[saveDoc()]', function () {
                
                var Couch,
                    document,
                    database;
                
                beforeEach(inject(function (_Couch_) {
                    Couch = _Couch_;
                    
                    document = {'document': true, save: jasmine.createSpy('save').andReturn(world.resolved(true))};
                    database = 'test';
                    
                    spyOn(Couch, 'databaseExists').andReturn(world.resolved(true));
                    spyOn(Couch, 'validateDoc').andReturn(world.resolved(true));
                }));
                
                it('should be a function', function () {
                    world.shouldBeAFunction(Couch, 'saveDoc');
                });
                
                it('should return a promise', function () {
                    var result = Couch.saveDoc(document, null, database);
                    
                    expect(result).toBeDefined();
                    expect(result.then).toBeDefined();
                    expect(typeof result.then).toBe('function');
                });
                
                it('should call through to validateDoc', function () {
                    Couch.saveDoc(document, database);
                    world.digest();
                    
                    expect(Couch.validateDoc).toHaveBeenCalledWith(document, null, database);
                });
                
                it('should verify the database exists', function () {
                    
                    Couch.saveDoc(document, database);
                    world.digest();
                    
                    expect(Couch.databaseExists).toHaveBeenCalledWith(database);
                });
                
                it('should trigger a save if successful', function () {
                    
                    Couch.saveDoc(document, database);
                    world.digest();
                    
                    expect(document.save).toHaveBeenCalledWith();
                });
                
                it('should not trigger a save if unsuccessful', function () {
                    
                    Couch.databaseExists.andReturn(world.resolved(false));
                    
                    Couch.saveDoc(document, database);
                    world.digest();
                    
                    expect(document.save).not.toHaveBeenCalledWith();
                });
                
                it('should pass through the reject message from validateDoc', function () {
                    var validateDocMessage = "MESSAGE_FROM_VALIDATEDOC";
                    Couch.validateDoc.andReturn(world.rejected(validateDocMessage));
                    
                    var response = Couch.saveDoc(document, database);
                    var success = null,
                        error = null;
                    response.then(function (_s_) { success = _s_; }, function (_e_) { error = _e_; });
                        
                    world.digest();
                    
                    expect(error).toBe(validateDocMessage);
                    expect(success).toBe(null);
                });
                
                it('should console error the reject message from validateDoc', function () {
                    var validateDocMessage = "MESSAGE_FROM_VALIDATEDOC";
                    Couch.validateDoc.andReturn(world.rejected(validateDocMessage));
                    spyOn(console, 'error').andCallFake(function () {});
                    
                    Couch.saveDoc(document, database);
                        
                    world.digest();
                    
                    expect(console.error).toHaveBeenCalledWith(validateDocMessage);
                });
            });
        });
        
        describe('[_designDocs]', function () {
            
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
                    expect(Couch._designDocs.commissar_validation_global).toBeDefined();
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
                    $rootScope.cornercouch.userCtx.roles = ['+admin'];
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
                    expect(Couch._designDocs.commissar_validation_users).toBeDefined();
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
                
                it('should require ids to be pre-determined', function () {
                    var badId = jquery.extend({}, validDocument);
                    delete badId._id;
                    testValidate(badId, null, userDb, undefined, 'ID is missing');
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
                    
                    describe('[views]', function () {
                        
                        var Couch;
                        
                        beforeEach(inject(function (_Couch_) {
                            Couch = _Couch_;
                        }));
                        
                        it("should contain a views key", function () {
                            expect(Couch._designDocs.commissar_validation_users['_design/validation_user_media'].views).toBeDefined();
                        });
                        
                        describe("[all]", function () {
                            
                            var view,
                                emit;
                            
                            beforeEach(function () {
                                view = Couch._designDocs.commissar_validation_users['_design/validation_user_media'].views.all;
                                window.emit = emit = jasmine.createSpy("emit");
                            });
                            
                            it("should exist", function () {
                                expect(Couch._designDocs.commissar_validation_users['_design/validation_user_media'].views.all).toBeDefined();
                            });
                            
                            it("should emit if the document is a media-type", function () {
                                var document = {
                                    type: 'media',
                                    someKey: true
                                };
                                
                                view.map(document);
                                
                                expect(emit).toHaveBeenCalledWith(null, document);
                            });
                            
                            it("should not emit if the document is any other type", function () {
                                var document = {
                                    type: 'other',
                                    someKey: true
                                };
                                
                                view.map(document);
                                
                                expect(emit).not.toHaveBeenCalled();
                            });
                        });
                        
                        describe("[byAuthor]", function () {
                            
                            var view,
                                emit;
                            
                            beforeEach(function () {
                                view = Couch._designDocs.commissar_validation_users['_design/validation_user_media'].views.byAuthor;
                                window.emit = emit = jasmine.createSpy("emit");
                            });
                            
                            it("should exist", function () {
                                expect(Couch._designDocs.commissar_validation_users['_design/validation_user_media'].views.byAuthor).toBeDefined();
                            });
                            
                            it("should emit by author if the document is a media-type", function () {
                                var document = {
                                    type: 'media',
                                    someKey: true,
                                    author: 'john smith'
                                };
                                
                                view.map(document);
                                
                                expect(emit).toHaveBeenCalledWith(document.author, document);
                                
                                var doc2 = {
                                    type: 'media',
                                    someKey: true,
                                    author: 'jane doe'
                                };
                                
                                view.map(doc2);
                                
                                expect(emit).toHaveBeenCalledWith(doc2.author, doc2);
                            });
                            
                            it("should not emit if the document is any other type", function () {
                                var document = {
                                    type: 'other',
                                    someKey: true,
                                    author: 'john smith'
                                };
                                
                                view.map(document);
                                
                                expect(emit).not.toHaveBeenCalled();
                            });
                        });
                    });
                });
            });
        });

    });
    
});