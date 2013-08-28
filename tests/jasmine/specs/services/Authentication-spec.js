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
                Authentication.shut_up_jshint = true;
            }));
        });

        describe('[functions]', function () {
            beforeEach(function () {
            });

            describe('[userExists()]', function () {

                it('should be a function', inject(function (Authentication) {
                    world.shouldBeAFunction(Authentication, 'userExists');
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
                    
                    Authentication.userExists('Frank');
                    world.digest();
                    
                    expect(Couch.databaseExists).toHaveBeenCalledWith("commissar_user_frank");
                }));
                
                it('should not fail on undefined', inject(function (Authentication) {
                    Authentication.userExists(undefined).then(function (result) {
                        expect(result).toEqual(false);
                    });
                }));

            });
            
            describe('[loggedIn()]', function () {
                
                // decide how to handle cookies etc
                
                it('should be a function', inject(function (Authentication) {
                    world.shouldBeAFunction(Authentication, 'loggedIn');
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
                    
                    $cookies.wasLoggedIn = true;
                    
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
                    
                    delete $cookies.wasLoggedIn;
                    
                    Authentication.loggedIn().then(function (response) {
                        expect(response).toEqual(false);
                    });
                });
                
                describe('', function () {
                    var $cookies;
                        
                    beforeEach(function () {
                        inject(function (_$cookies_) {
                            $cookies = _$cookies_;
                            $cookies.wasLoggedIn = true;
                        });
                    });
                    
                    it('should return false when logged out', inject(function (Couch, Authentication) {
                        
                        var response = null;
                        
                        spyOn(Couch, 'getSession').andReturn(world.resolved({
                            name: null,
                            roles: []
                        }));
                        
                        Authentication.loggedIn().then(function (resp) {
                            response = resp;
                        });
                        
                        world.digest();
                        
                        expect(Couch.getSession).toHaveBeenCalled();
                        expect(response).toEqual(false);
                    }));
                    
                    it('should return true when logged in', inject(function (Couch, Authentication) {
                        
                        var response = null;
                        
                        spyOn(Couch, 'getSession').andReturn(world.resolved({
                            name: 'john',
                            roles: ['user']
                        }));
                            
                        Authentication.loggedIn().then(function (resp) {
                            response = resp;
                        });
                        
                        world.digest();
                        
                        expect(Couch.getSession).toHaveBeenCalled();
                        expect(response).toEqual(true);
                    }));
                });
                
            });
            
            describe('[login()]', function () {
                it('should be a function', inject(function (Authentication) {
                    world.shouldBeAFunction(Authentication, 'login');
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
                
                it('should trigger event AuthChange', inject(function ($rootScope, Couch, Authentication) {
                    spyOn($rootScope, "$broadcast");
                    spyOn(Couch, 'login').andReturn(world.resolved(true));
                    
                    Authentication.login('john', 'password');
                    
                    world.digest();
                    
                    expect($rootScope.$broadcast).toHaveBeenCalledWith('AuthChange');
                    
                }));
                
                it('should return false on errors', inject(function (Couch, Authentication) {
                    spyOn(Couch, 'login').andReturn(world.rejected(false));
                    
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
            
            describe('[register()]', function () {
                
                it('should be a function', inject(function (Authentication) {
                    world.shouldBeAFunction(Authentication, 'register');
                }));
                
                it('should return a promise', inject(function (Authentication) {
                    $httpBackend.expectPOST('/server/register.php').respond({ok: true});
                    
                    var result = Authentication.register('username', 'password'),
                        response = null;
                    
                    world.flush();
                    
                    expect(result.then).toBeDefined();
                    expect(typeof result.then).toBe('function');
                    result.then(function (_response_) { response = _response_; });
                    
                    world.digest();
                    
                    expect(response).toBe(true);
                }));
                
                it('should post the user+pass to the server', inject(function (Authentication) {
                    var username = 'username',
                        password = 'password';
                    
                    $httpBackend.expectPOST('/server/register.php', 'username=' + username + '&password=' + password).respond({ok: true});
                    
                    Authentication.register(username, password);
                    world.flush();
                }));
                
                it('should handle failures', inject(function (Authentication) {
                    var username = 'a_registered_username',
                        password = 'password',
                        failureMessage = 'That username is already taken!',
                        response = null;
                        
                    $httpBackend.expectPOST('/server/register.php').respond({error: failureMessage});
                    
                    Authentication.register(username, password).then(function (_response_) { response = _response_; });
                    
                    world.flush();
                    
                    expect(response).toBe(failureMessage);
                    
                    $httpBackend.expectPOST('/server/register.php').respond(500, null);
                    
                    Authentication.register(username, password).then(function (_response_) { response = _response_; });
                    
                    world.flush();
                    
                    expect(response).toBe(false);
                }));
            });
            
            describe('[getSession()]', function () {
                it('should be a function', inject(function (Authentication) {
                    world.shouldBeAFunction(Authentication, 'getSession');
                }));
                
                it('should return a promise', inject(function (Authentication, Couch) {
                    
                    var ctx = {name: 'john', roles: []};
                    
                    spyOn(Couch, 'getSession').andReturn(world.resolved(ctx));
                    
                    var result = Authentication.getSession(),
                        response = null;
                    
                    expect(result).toBeDefined();
                    expect(result.then).toBeDefined();
                    result.then(function (_response_) { response = _response_; });
                    
                    world.digest();
                    
                    expect(response).toBe(ctx);
                }));
            });
            
            describe('[getDatabaseName()]', function () {
                it('should be a function', inject(function (Authentication) {
                    world.shouldBeAFunction(Authentication, 'getDatabaseName');
                }));
                
                it('should decorate a string', inject(function (Authentication) {
                    var username = "john";
                    
                    expect(Authentication.getDatabaseName(username)).toBe("commissar_user_" + username)
                }));
                
                it('should convert to lower case', inject(function (Authentication) {
                    var username = 'JohnSmith';
                    
                    expect(Authentication.getDatabaseName(username)).toBe("commissar_user_" + username.toLowerCase());
                }));
            })
        });

    });

});