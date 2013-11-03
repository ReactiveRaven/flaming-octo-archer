/* global inject:false, afterEach:false */

define(['world', 'angular'], function (world, angular) {
    "use strict";

    var element,
        scope,
        $httpBackend,
        $templateCache,
        $rootScope,
        Authentication,
        $location,
        $timeout;

    describe('[commissar.directives.LoginForm]', function () {
        beforeEach(function () {

            module('commissar.directives.LoginForm', 'templates');

            inject(function (_$httpBackend_, _$rootScope_, _$templateCache_, _Authentication_, _$location_, _$timeout_) {

                $httpBackend = _$httpBackend_;
                $templateCache = _$templateCache_;
                $rootScope = _$rootScope_;

                scope = $rootScope.$new();

                Authentication = _Authentication_;
                $location = _$location_;
                spyOn(Authentication, 'loggedIn').andReturn(world.resolved(true));
                spyOn(Authentication, 'login').andReturn(world.resolved(true));
                spyOn(Authentication, 'userExists').andReturn(world.resolved(true));
                spyOn(Authentication, 'register').andReturn(world.resolved(true));
                spyOn($location, 'path');
                $timeout = _$timeout_;
            });
        });
        
        afterEach(function () {
            $httpBackend.verifyNoOutstandingExpectation();
            $httpBackend.verifyNoOutstandingRequest();
        });

        var compileDirective = function () {
            inject(function ($compile) {
                element = angular.element(
                        '<div data-login-form=""></div>'
                    );

                $compile(element)(scope);
                
                scope.$apply();
            });
        };
        
        var getCtrl = function () {
            var ctrl = null;
            inject(function ($controller) {
                ctrl = $controller('commissar.directives.LoginForm.controller', {$scope: scope});
            });
            
            return ctrl;
        };

        it('should replace with a form element', function () {
            
            compileDirective();
            
            expect(element[0].tagName).toBe('FORM');
        });
        
        describe('[user state]', function () {
            
            it('should check if logged in', function () {
                getCtrl();
                world.digest();
                
                expect(Authentication.loggedIn).toHaveBeenCalled();
                expect(scope.loggedIn).toBe(true);
            });
            
            describe('[login()]', function () {
                it('should be a function', function () {
                    getCtrl();
                    world.shouldBeAFunction(scope, 'login');
                });
                
                it('should pass login requests to Authentication', function () {
                    var username = 'username',
                        password = 'password',
                        response = null;
                    
                    getCtrl();
                    
                    scope.login(username, password).then(function (_response_) {
                        response = _response_;
                    });
                    world.digest();
                    
                    expect(Authentication.login).toHaveBeenCalledWith(username, password);
                    expect(response).toBe(true);
                });
                
                it('should pull from scope if no arguments given', function () {
                    var username = 'username',
                        password = 'password',
                        response = null;
                    
                    getCtrl();
                    
                    scope.loginFormUsername = username;
                    scope.loginFormPassword = password;
                    
                    scope.login().then(function (_response_) {
                        response = _response_;
                    });
                    world.digest();
                    
                    expect(Authentication.login).toHaveBeenCalledWith(username, password);
                    expect(response).toBe(true);
                });
                
                it('should set loggedIn to null by default, until checked', function () {
                    getCtrl();
                    
                    expect(scope.loggedIn).toBe(null, 'by default');
                    
                    world.digest();
                    
                    expect(scope.loggedIn).toBe(true, 'after checking if logged in');
                });
                
                it('should set loggedIn to match response', function () {
                    var username = 'username',
                        password = 'password',
                        response = null;
                        
                    getCtrl();
                        
                    scope.loggedIn = false;
                        
                    scope.login(username, password).then(function (_response_) {
                        response = _response_;
                    });
                    world.digest();
                    
                    expect(response).toBe(true);
                    expect(scope.loggedIn).toBe(response);
                });
                
                it('should set accessDenied to false by default', function () {
                    getCtrl();
                    
                    expect(scope.accessDenied).toBe(false, 'by default');
                });
                
                it('should set accessDenied to oppose response', function () {
                    var username = 'username',
                        password = 'password';
                        
                    getCtrl();
                    
                    scope.accessDenied = null;
                    
                    scope.login(username, password);
                    world.digest();
                    
                    expect(scope.accessDenied).toBe(false, "Login succeeded, should have ");
                });
                
                it('should set accessDenied to true on login failure', function () {
                    var username = 'username',
                        password = 'password';
                        
                    Authentication.login.andReturn(world.resolved(false));
                        
                    getCtrl();
                    
                    scope.accessDenied = null;
                    
                    scope.login(username, password);
                    world.digest();
                    
                    expect(scope.accessDenied).toBe(true, "login failed, should have complained");
                });
                
                it('should set loginAttemptedRecently to false by default', function () {
                    getCtrl();
                    
                    expect(scope.loginAttemptedRecently).toBe(false);
                });
                
                it('should set loginAttemptedRecently to true after login finishes', function () {
                    var username = 'username',
                        password = 'password';
                        
                    getCtrl();
                    scope.login(username, password);
                    
                    expect(scope.loginAttemptedRecently).toBe(false, 'have not digested yet');

                    world.digest();
                    
                    expect(scope.loginAttemptedRecently).toBe(true, 'finished digesting');
                    
                    $timeout.flush();
                    
                    expect(scope.loginAttemptedRecently).toBe(false, 'no longer recent');
                });
            });
            
            describe('[userExists()]', function () {
                it('should be a function', function () {
                    getCtrl();
                    world.shouldBeAFunction(scope, 'userExists');
                });
                
                it('should pass login requests to Authentication', function () {
                    var username = 'username',
                        response = null;
                    
                    getCtrl();
                    
                    scope.userExists(username).then(function (_response_) {
                        response = _response_;
                    });
                    world.digest();
                    
                    expect(Authentication.userExists).toHaveBeenCalledWith(username);
                    expect(response).toBe(true);
                });
                
                it('should pull from scope if no arguments given', function () {
                    var username = 'username',
                        response = null;
                    
                    getCtrl();
                    
                    scope.loginFormUsername = username;
                    
                    scope.userExists().then(function (_response_) {
                        response = _response_;
                    });
                    world.digest();
                    
                    expect(Authentication.userExists).toHaveBeenCalledWith(username);
                    expect(response).toBe(true);
                });
            });
            
            describe('[isUsernameRecognised()]', function () {
                it('should be a function', function () {
                    getCtrl();
                    world.shouldBeAFunction(scope, 'isUsernameRecognised');
                });
                
                it('should pass login requests to Authentication', function () {
                    var username = 'username',
                        response = null;
                    
                    getCtrl();
                    
                    response = scope.isUsernameRecognised(username);
                    world.digest();
                    
                    expect(Authentication.userExists).toHaveBeenCalledWith(username);
                    expect(response).toBe(false);
                });
                
                it('should return real values', function () {
                    var username = 'username',
                        response = null;
                    
                    getCtrl();
                    
                    response = scope.isUsernameRecognised(username);
                    world.digest();
                    
                    expect(Authentication.userExists).toHaveBeenCalledWith(username);
                    expect(response).toBe(false);
                });
                
                it('should pull from scope if no arguments given', function () {
                    var username = 'username',
                        response = null;
                    
                    getCtrl();
                    
                    scope.loginFormUsername = username;
                    
                    response = scope.isUsernameRecognised();
                    world.digest();
                    
                    expect(Authentication.userExists).toHaveBeenCalledWith(username);
                    expect(response).toBe(false);
                });
                
                it('should update once a response is received from the server', function () {
                    var username = 'username',
                        response = null;
                    
                    getCtrl();
                    
                    scope.loginFormUsername = username;
                    
                    scope.isUsernameRecognised();
                    world.digest();
                    response = scope.isUsernameRecognised();
                    
                    expect(Authentication.userExists).toHaveBeenCalledWith(username);
                    expect(response).toBe(true);
                });
            });
            
            describe('[register()]', function () {
                it('should be a function', function () {
                    getCtrl();
                    world.shouldBeAFunction(scope, 'register');
                });
                
                it('should pass registration requests to Authentication', function () {
                    var username = 'username',
                        password = 'password',
                        response = null;
                        
                    getCtrl();
                    
                    scope.register(username, password).then(function (_response_) { response = _response_; });
                    world.digest();
                    
                    expect(Authentication.register).toHaveBeenCalledWith(username, password);
                    expect(response).toBe(true);
                });
                                
                it('should pull from scope if no arguments given', function () {
                    var username = 'username',
                        password = 'password',
                        response = null;
                    
                    getCtrl();
                    
                    scope.loginFormUsername = username;
                    scope.loginFormPassword = password;
                    
                    scope.register().then(function (_response_) {
                        response = _response_;
                    });
                    world.digest();
                    
                    expect(Authentication.register).toHaveBeenCalledWith(username, password);
                    expect(response).toBe(true);
                });
                
                it('should forward to the profile setup page when successful', inject(function ($location) {
                    var username = 'username',
                        password = 'password',
                        response = null;
                    
                    getCtrl();
                    
                    scope.loginFormUsername = username;
                    scope.loginFormPassword = password;
                    
                    scope.register().then(function (_response_) {
                        response = _response_;
                    });
                    world.digest();
                    
                    expect(response).toBe(true);
                    expect($location.path).toHaveBeenCalledWith("/welcome");
                }));
                
                it('should login after successfully registering', function () {
                    var username = 'username',
                        password = 'password',
                        response = null;
                    
                    getCtrl();
                    
                    scope.loginFormUsername = username;
                    scope.loginFormPassword = password;
                    
                    scope.register().then(function (_response_) {
                        response = _response_;
                    });
                    world.digest();
                    
                    expect(response).toBe(true);
                    expect(Authentication.login).toHaveBeenCalledWith(username, password);
                });
                
                it('should do nothing if not successful', inject(function (Authentication) {
                    var username = 'username',
                        password = 'password',
                        response = null;
                        
                    Authentication.register.andReturn(world.resolved(false));
                    
                    getCtrl();
                    
                    scope.loginFormUsername = username;
                    scope.loginFormPassword = password;
                    
                    scope.register().then(function (_response_) {
                        response = _response_;
                    });
                    world.digest();
                    
                    expect(response).toBe(false);
                    expect($location.path).not.toHaveBeenCalled();
                    expect(Authentication.register).toHaveBeenCalledWith(username, password);
                }));
            });
            
        });
        
    });
});