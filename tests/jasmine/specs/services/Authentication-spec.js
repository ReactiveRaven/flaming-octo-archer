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
            
            describe('[logout()]', function () {
                
                var Authentication,
                    Couch;
                
                beforeEach(inject(function (_Authentication_, _Couch_) {
                    Authentication = _Authentication_;
                    Couch = _Couch_;
                    
                    spyOn(Couch, "logout").andReturn(world.resolved(true));
                }));
                
                it('should be a function', function () {
                    world.shouldBeAFunction(Authentication, 'logout');
                });
                
                it('should call through to Couch', function () {
                    Authentication.logout();
                    
                    expect(Couch.logout).toHaveBeenCalled();
                });
                
                it('should broadcast AuthChange', inject(function ($rootScope) {
                    spyOn($rootScope, '$broadcast');
                    
                    Authentication.logout();
                    
                    world.digest();
                    
                    expect($rootScope.$broadcast).toHaveBeenCalledWith("AuthChange");
                }));
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
                
                var Couch;
                
                beforeEach(inject(function (_Couch_) {
                    Couch = _Couch_;
                    
                    spyOn(Couch, "loggedIn").andReturn(world.resolved(true));
                }));
                
                it('should be a function', inject(function (Authentication) {
                    world.shouldBeAFunction(Authentication, 'loggedIn');
                }));
                
                it('should return a promise', inject(function (Authentication) {
                    var response = Authentication.loggedIn();
                    expect(typeof response).not.toEqual('undefined');
                    expect(typeof response.then).toEqual('function');
                }));
                
                it('should call through to Couch.loggedIn', inject(function (Authentication, Couch) {
                    var success = null,
                        error = null;
                    
                    Authentication.loggedIn().then(function (_success_) { success = _success_; }, function (_error_) { error = _error_; });
                    
                    world.digest();
                    
                    expect(Couch.loggedIn).toHaveBeenCalled();
                    expect(success).toBe(true);
                    expect(error).toBe(null);
                }));
                
            });
            
            describe('[hasRole()]', function () {
                
                var Couch;
                
                beforeEach(inject(function (_Couch_) {
                    Couch = _Couch_;
                    
                    spyOn(Couch, "hasRole").andReturn(world.resolved(true));
                }));
                
                it('should be a function', inject(function (Authentication) {
                    world.shouldBeAFunction(Authentication, 'hasRole');
                }));
                
                it('should return a promise', inject(function (Authentication) {
                    var response = Authentication.hasRole();
                    expect(typeof response).not.toEqual('undefined');
                    expect(typeof response.then).toEqual('function');
                }));
                
                it('should call through to Couch.hasRole', inject(function (Authentication, Couch) {
                    var success = null,
                        error = null;
                    
                    Authentication.hasRole().then(function (_success_) { success = _success_; }, function (_error_) { error = _error_; });
                    
                    world.digest();
                    
                    expect(Couch.hasRole).toHaveBeenCalled();
                    expect(success).toBe(true);
                    expect(error).toBe(null);
                }));
                
            });
            
            describe('[isAdmin()]', function () {
                
                var Authentication;
                
                beforeEach(inject(function (_Authentication_) {
                    Authentication = _Authentication_;
                    
                    spyOn(Authentication, "hasRole").andReturn(world.resolved(true));
                }));
                
                it('should be a function', inject(function (Authentication) {
                    world.shouldBeAFunction(Authentication, 'hasRole');
                }));
                
                it('should return a promise', inject(function (Authentication) {
                    var response = Authentication.isAdmin();
                    expect(typeof response).not.toEqual('undefined');
                    expect(typeof response.then).toEqual('function');
                }));
                
                it('should call through to Authentication.hasRole', function () {
                    var success = null,
                        error = null;
                    
                    Authentication.isAdmin().then(function (_success_) { success = _success_; }, function (_error_) { error = _error_; });
                    
                    world.digest();
                    
                    expect(Authentication.hasRole).toHaveBeenCalledWith("+admin");
                    expect(success).toBe(true);
                    expect(error).toBe(null);
                });
                
            });
            
            describe('[getUsername()]', function () {
                
                var Authentication,
                    ctx;
                
                beforeEach(inject(function (_Authentication_) {
                    Authentication = _Authentication_;
                    
                    ctx = {name: 'john', roles: []};
                    
                    spyOn(Authentication, 'loggedIn').andReturn(world.resolved(true));
                    spyOn(Authentication, 'getSession').andReturn(world.resolved(ctx));
                }));
                
                it('should be a function', function () {
                    world.shouldBeAFunction(Authentication, 'getUsername');
                });
                
                it('should return a promise', function () {
                    var reply = Authentication.getUsername();
                    
                    expect(reply).toBeDefined();
                    expect(reply.then).toBeDefined();
                    expect(typeof reply.then).toBe('function');
                });
                
                it('should check if logged in', function () {
                    var success = null,
                        error = null;
                        
                    Authentication.loggedIn.andReturn(world.resolved(false));
                    
                    Authentication.getUsername().then(function (_s_) { success = _s_; }, function (_e_) { error = _e_; });
                    
                    world.digest();
                    
                    expect(Authentication.loggedIn).toHaveBeenCalled();
                    expect(success).toBe(null);
                    expect(error).toBe("Not logged in");
                });
                
                it('should pull username from session', function () {
                    var success = null,
                        error = null;
                    
                    Authentication.getUsername().then(function (_s_) { success = _s_; }, function (_e_) { error = _e_; });
                    
                    world.digest();
                    
                    expect(Authentication.getSession).toHaveBeenCalled();
                    expect(success).toBe(ctx.name);
                    expect(error).toBe(null);
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
                    
                    expect(Authentication.getDatabaseName(username)).toBe("commissar_user_" + username);
                }));
                
                it('should convert to lower case', inject(function (Authentication) {
                    var username = 'JohnSmith';
                    
                    expect(Authentication.getDatabaseName(username)).toBe("commissar_user_" + username.toLowerCase());
                }));
            });
        });

    });

});