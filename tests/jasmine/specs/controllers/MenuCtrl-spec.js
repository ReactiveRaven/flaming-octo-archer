/* global inject:false, afterEach:false */

define(['world', 'angular'], function (world, angular) {
    "use strict";
    
    describe('[commissar.controllers.MenuCtrl]', function () {
        
        var scope, $httpBackend;
        
        beforeEach(function () {
            module('commissar.controllers.MenuCtrl');
            
            inject(['$httpBackend', '$rootScope', function (_$httpBackend_, $rootScope) {
                $httpBackend = _$httpBackend_;
                scope = $rootScope.$new();
            }]);
        });
        
        afterEach(function () {
            $httpBackend.verifyNoOutstandingExpectation();
            $httpBackend.verifyNoOutstandingRequest();
        });
        
        var getCtrl = function () {
            var ctrl = null;
            inject(function ($controller) {
                ctrl = $controller('MenuCtrl', {$scope: scope});
            });
            
            return ctrl;
        };
        
        describe('[$routes]', function () {
            it('should not have routes defined', inject(function ($route) {
                angular.forEach($route.routes, function (key, value) {
                    expect(value.controller).not.toBe('MenuCtrl');
                });
            }));
        });
        
        describe('[setup]', function () {
            it('should set the scope name', function () {
                getCtrl();

                expect(scope).toBeDefined();
                expect(scope.name).toBeDefined();
                expect(scope.name).toBe('MenuCtrl');
            });
        });
        
        describe('[user state]', function () {
            var Authentication;
            
            beforeEach(inject(['Authentication', function (_Authentication_) {
                Authentication = _Authentication_;
                spyOn(Authentication, 'loggedIn').andReturn(world.resolved(true));
                spyOn(Authentication, 'login').andReturn(world.resolved(true));
                spyOn(Authentication, 'userExists').andReturn(world.resolved(true));
            }]));
            
            it('should check if logged in', function () {
                getCtrl();
                world.digest();
                
                expect(Authentication.loggedIn).toHaveBeenCalled();
                expect(scope.loggedIn).toBe(true);
            });
            
            describe('[login()]', function () {
                it('should be a function', function () {
                    getCtrl();
                    
                    expect(typeof scope.login).toBe('function');
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
                    
                    expect(scope.loggedIn).toBe(true);
                });
            });
            
            describe('[userExists()]', function () {
                it('should be a function', function () {
                    getCtrl();
                    
                    expect(typeof scope.userExists).toBe('function');
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
                    
                    expect(typeof scope.isUsernameRecognised).toBe('function');
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
            
        });
    });
});