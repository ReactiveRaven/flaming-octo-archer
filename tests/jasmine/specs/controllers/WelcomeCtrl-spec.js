/* global inject:false, afterEach:false */

define(['world'], function (world) {
    "use strict";
    
    describe('[commissar.controllers.WelcomeCtrl]', function () {
        
        var scope, $httpBackend;
        
        beforeEach(function () {
            module('commissar.controllers.WelcomeCtrl');
            
            inject(['$httpBackend', function (_$httpBackend_) {
                $httpBackend = _$httpBackend_;
            }]);
        });
        
        afterEach(function () {
            $httpBackend.verifyNoOutstandingExpectation();
            $httpBackend.verifyNoOutstandingRequest();
        });
        
        var getCtrl = function () {
            var ctrl = null;
            inject(function ($controller, $rootScope) {
                scope = $rootScope.$new();
                ctrl = $controller('WelcomeCtrl', {$scope: scope});
            });
            
            return ctrl;
        };
        
        describe('[setup]', function () {
            it('should set the scope name', function () {
                getCtrl();

                expect(scope).toBeDefined();
                expect(scope.name).toBeDefined();
                expect(scope.name).toBe('WelcomeCtrl');
            });
        });
        
        
        describe('[$routes]', function () {
            it('should have the routes defined', inject(function ($route, $location) {
                
                expect($route.current).toBeUndefined();
                
                $httpBackend.expectGET('angular/templates/welcome.html').respond(200, '');
                $location.path('/welcome');
                world.digest();
                world.flush();
                expect($route.current).toBeDefined();
                expect($route.current.templateUrl).toBe('angular/templates/welcome.html');
                expect($route.current.controller).toBe('WelcomeCtrl');
            }));
        });
    });
});