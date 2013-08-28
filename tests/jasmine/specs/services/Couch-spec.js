/* global afterEach:false, inject:false */

define(['world'], function (world) {
    "use strict";

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
                    Couch = Couch; // shut up jshint
                    
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
                    Couch.getSession();
                    
                    var response = null;
                    
                    Couch.getSession().then(function (_response_) { response = _response_; });
                    
                    world.digest();
                    
                    expect(response).toBe(ctx);
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
        });

    });
    
});