/* global inject:false, afterEach:false */

define(['world'], function (world) {
    "use strict";
    
    describe('[commissar.controllers.IndexCtrl]', function () {
        
        var scope, $httpBackend;
        
        beforeEach(function () {
            module('commissar.controllers.IndexCtrl');
            
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
                ctrl = $controller('IndexCtrl', {$scope: scope});
            });
            
            return ctrl;
        };
        
        describe('[setup]', function () {
            it('should set the scope name', function () {
                getCtrl();

                expect(scope).toBeDefined();
                expect(scope.name).toBeDefined();
                expect(scope.name).toBe('IndexCtrl');
            });
        });
        
        
        describe('[$routes]', function () {
            it('should have the routes defined', inject(function ($route, $location) {
                
                expect($route.current).toBeUndefined();
                
                $httpBackend.expectGET('angular/templates/index.html').respond(200, '');
                $location.path('/');
                world.digest();
                world.flush();
                expect($route.current).toBeDefined();
                expect($route.current.templateUrl).toBe('angular/templates/index.html');
                expect($route.current.controller).toBe('IndexCtrl');
                
                $location.path('/otherwise');
                world.digest();
                expect($location.path()).toBe('/');
                expect($route.current.templateUrl).toBe('angular/templates/index.html');
                expect($route.current.controller).toBe('IndexCtrl');
            }));
        });
    });
});