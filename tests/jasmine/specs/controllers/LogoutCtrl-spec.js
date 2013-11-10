/* global inject:false, afterEach:false */

define(['world'], function (world) {
    "use strict";
    
    describe('[commissar.controllers.LogoutCtrl]', function () {
        
        var scope,
            $httpBackend,
            Authentication;
        
        beforeEach(function () {
            module('commissar.controllers.LogoutCtrl');
            
            inject(function (_$httpBackend_, _Authentication_) {
                $httpBackend = _$httpBackend_;
                Authentication = _Authentication_;
                spyOn(Authentication, "logout");
            });
        });
        
        afterEach(function () {
            $httpBackend.verifyNoOutstandingExpectation();
            $httpBackend.verifyNoOutstandingRequest();
        });
        
        var getCtrl = function () {
            var ctrl = null;
            inject(function ($controller, $rootScope) {
                scope = $rootScope.$new();
                ctrl = $controller('LogoutCtrl', {$scope: scope});
            });
            
            return ctrl;
        };
        
        describe('[setup]', function () {
            it('should set the scope name', function () {
                getCtrl();

                expect(scope).toBeDefined();
                expect(scope.name).toBeDefined();
                expect(scope.name).toBe('LogoutCtrl');
            });
            
            it('should call through to Authentication', function () {
                getCtrl();
                
                expect(Authentication.logout).toHaveBeenCalled();
            });
        });
        
        
        describe('[$routes]', function () {
            it('should have the routes defined', inject(function ($route, $location) {
                
                expect($route.current).toBeUndefined();
                
                $httpBackend.expectGET('angular/templates/logout.html').respond(200, '');
                $location.path('/logout');
                world.digest();
                world.flush();
                expect($route.current).toBeDefined();
                expect($route.current.templateUrl).toBe('angular/templates/logout.html');
                expect($route.current.controller).toBe('LogoutCtrl');
            }));
        });
    });
});