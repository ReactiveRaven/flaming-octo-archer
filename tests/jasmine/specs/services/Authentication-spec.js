/* global afterEach:false, inject:false */

define(['world'], function (world) {
    "use strict";
    
    describe('[commissar.services.Authentication]', function () {

        var $httpBackend;

        beforeEach(function () {
            module('commissar.services.Authentication');

            inject(function (_$httpBackend_) {
                $httpBackend = _$httpBackend_;
            });
        });

        afterEach(function () {
            $httpBackend.verifyNoOutstandingExpectation();
            $httpBackend.verifyNoOutstandingRequest();
        });

        describe('[constructor]', function () {
            it('should not make requests unnecessarily', inject(function (Authentication) {
                // no flush!
                Authentication = Authentication; // shut up jshint
            }));
        });

        describe('[functions]', function () {
            beforeEach(function () {
            });

            describe('[userExists()]', function () {

                it('should be a function', inject(function (Authentication) {
                    expect(Authentication.userExists).toBeDefined();
                    expect(typeof Authentication.userExists).toEqual('function');
                }));
                
                it('should return a promise', inject(function (Couch, Authentication) {
                    spyOn(Couch, 'databaseExists').andReturn(world.resolved(true));
                    var response = Authentication.userExists('something');
                    expect(typeof response).not.toEqual('undefined');
                    expect(typeof response.then).toEqual('function');
                }));

                it('should return true if the user exists', inject(function (Couch, Authentication) {
                    spyOn(Couch, 'databaseExists').andReturn(world.resolved(true));
                    
                    Authentication.userExists('geraldine').then(function (result) {
                        expect(result).toEqual(true);
                    });
                    
                    Authentication.userExists('fish').then(function (result) {
                        expect(result).toEqual(true);
                    });
                }));

                it('should return false if the user does not exist', inject(function (Couch, Authentication) {
                    spyOn(Couch, 'databaseExists').andReturn(world.resolved(false));
                    
                    Authentication.userExists('frank').then(function (result) {
                        expect(result).toEqual(false);
                    });
                    
                    Authentication.userExists('susan').then(function (result) {
                        expect(result).toEqual(false);
                    });
                }));
                
                it('should be case insensitive', inject(function (Couch, Authentication) {
                    spyOn(Couch, 'databaseExists').andReturn(world.resolved(true));
                }))

            });
            
            describe('[loggedIn()]', function () {
                
                // decide how to handle cookies etc
                
                it('should be a function', inject(function (Authentication) {
                    expect(Authentication.loggedIn).toBeDefined();
                    expect(typeof Authentication.loggedIn).toEqual('function');
                }));
                
                it('should return a promise', inject(function (Authentication) {
                    var response = Authentication.loggedIn();
                    expect(typeof response).not.toEqual('undefined');
                    expect(typeof response.then).toEqual('function');
                }));
                
                it('should check for an existing cookie', function () {
                    var $cookies,
                        Authentication,
                        Couch;
                        
                    inject(function (_$cookies_, _Authentication_, _Couch_) {
                        $cookies = _$cookies_;
                        Authentication = _Authentication_;
                        Couch = _Couch_;
                    });
                    
                    $cookies.AuthSession = 'SOME_VALUE_HERE';
                    
                    spyOn(Couch, 'getSession').andReturn(world.resolved({
                        name: 'john',
                        roles: ['user']
                    }));
                    
                    Authentication.loggedIn();
                    
                    expect(Couch.getSession).toHaveBeenCalled();
                });
                
                it('should assume logged out if no existing cookie', function () {
                    var $cookies,
                        Authentication;
                    
                    inject(function (_$cookies_, _Authentication_) {
                        $cookies = _$cookies_;
                        Authentication = _Authentication_;
                    });
                    
                    delete $cookies.AuthSession;
                    
                    Authentication.loggedIn().then(function (response) {
                        expect(response).toEqual(false);
                    });
                });
                
                describe('[return values]', function () {
                    var $cookies;
                        
                    beforeEach(function () {
                        inject(function (_$cookies_) {
                            $cookies = _$cookies_;
                            $cookies.AuthSession = 'SOME_VALUE_HERE';
                        });
                    });
                    
                    it('should return false when logged out', inject(function (Couch, Authentication) {
                        spyOn(Couch, 'getSession').andReturn(world.resolved({
                            name: null,
                            roles: []
                        }));
                        
                        Authentication.loggedIn().then(function (response) {
                            expect(response).toEqual(false);
                        });
                        
                        expect(Couch.getSession).toHaveBeenCalled();
                    }));
                    
                    it('should return true when logged in', inject(function (Couch, Authentication) {
                            
                        spyOn(Couch, 'getSession').andReturn(world.resolved({
                            name: 'john',
                            roles: ['user']
                        }));
                            
                        Authentication.loggedIn().then(function (response) {
                            expect(response).toEqual(true);
                        });
                        
                        expect(Couch.getSession).toHaveBeenCalled();
                    }));
                });
                
            });
            
            describe('[login()]', function () {
                it('should be a function', inject(function (Authentication) {
                    expect(Authentication.login).toBeDefined();
                    expect(typeof Authentication.login).toEqual('function');
                }));
                
                it('should return a promise', inject(function (Couch, Authentication) {
                    spyOn(Couch, 'login').andReturn(world.resolved(true));
                    var response = Authentication.login('username', 'password');
                    expect(typeof response).not.toEqual('undefined');
                    expect(typeof response.then).toEqual('function');
                }));
                
                it('should call through to Couch', inject(function (Couch, Authentication) {
                    spyOn(Couch, 'login').andReturn(world.resolved(true));
                    Authentication.login('john', 'password');
                    expect(Couch.login).toHaveBeenCalledWith('john', 'password');
                }));
                
                it('should return true if the login succeeded', inject(function (Couch, Authentication) {
                    spyOn(Couch, 'login').andReturn(world.resolved(true));
                    
                    var succeeded = null,
                        failed = null;
                    
                    Authentication.login('john', 'password').then(function (response) {
                        succeeded = response;
                    }, function (response) {
                        failed = response;
                    });
                    
                    world.digest();
                    
                    expect(succeeded).toEqual(true);
                    expect(failed).toEqual(null);
                }));
                
                it('should return false if the login failed', inject(function (Couch, Authentication) {
                    spyOn(Couch, 'login').andReturn(world.resolved(false));
                    
                    var succeeded = null,
                        failed = null;
                    
                    Authentication.login('john', 'password').then(function (response) {
                        succeeded = response;
                    }, function (response) {
                        failed = response;
                    });
                    
                    world.digest();
                    
                    expect(succeeded).toEqual(false);
                    expect(failed).toEqual(null);
                }));
            });
        });

    });

});