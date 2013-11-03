/* global inject:false, afterEach:false */

define(['world', 'angular'], function (world, angular) {
    "use strict";
    
    describe('[commissar.controllers.MenuCtrl]', function () {
        
        var scope,
            $httpBackend,
            ctx = {name: 'john', roles: []};
        
        beforeEach(function () {
            module('commissar.controllers.MenuCtrl');
            
            inject(['$httpBackend', '$rootScope', function (_$httpBackend_, $rootScope) {
                $httpBackend = _$httpBackend_;
                scope = $rootScope.$new();
            }]);
        });
        
        
        beforeEach(inject(function (Authentication) {
            spyOn(Authentication, 'loggedIn').andReturn(world.resolved(true));
            spyOn(Authentication, 'getSession').andReturn(world.resolved(ctx));
            spyOn(Authentication, 'hasRole').andReturn(world.resolved(true));
        }));
        
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
        
        describe('[onAuthChange()]', function () {

            it('should be a function', function () {
                getCtrl();
                world.shouldBeAFunction(scope, 'onAuthChange');
            });

            it('should not trigger an apply on AuthChange when already in progress', inject(function ($rootScope) {
                getCtrl();

                spyOn(scope, '$digest');

                scope.$$phase = "$apply";

                $rootScope.$broadcast('AuthChange');

                expect(scope.$digest).not.toHaveBeenCalled();
            }));

            it('should update the userCtx when logged in', inject(function ($rootScope, Authentication) {
                getCtrl();

                $rootScope.$broadcast('AuthChange');

                world.digest();

                expect(Authentication.loggedIn).toHaveBeenCalled();
                expect(Authentication.getSession).toHaveBeenCalled();
                expect(scope.userCtx).toBe(ctx);
            }));

            it('should update loggedIn when logged in', inject(function ($rootScope) {
                getCtrl();

                $rootScope.$broadcast('AuthChange');

                world.digest();

                expect(scope.loggedIn).toBe(true);
            }));

            it('should update isAdmin when logged in as an admin', inject(function ($rootScope, Authentication) {

                // Return a ctx with admin role
                var newCtx = angular.extend({}, ctx, {roles: ['+admin']});
                Authentication.getSession.andReturn(world.resolved(newCtx));

                // Set up controller and trigger AuthChange
                getCtrl();
                $rootScope.$broadcast('AuthChange');

                // Wait for it to digest..
                world.digest();

                // Should be recognised as an admin.
                expect(scope.isAdmin).toBe(true);
            }));
            
            it('should listen for AuthChange', function () {
                spyOn(scope, '$on');

                getCtrl();

                expect(scope.$on).toHaveBeenCalledWith('AuthChange', scope.onAuthChange);
            });
        });
    });
});