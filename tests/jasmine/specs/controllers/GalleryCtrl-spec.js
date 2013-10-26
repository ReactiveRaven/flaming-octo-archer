/* global inject:false, afterEach:false */

define(['world'], function (world) {
    "use strict";
    
    describe('[commissar.controllers.GalleryCtrl]', function () {
        
        var scope, $httpBackend;
        
        beforeEach(function () {
            module('commissar.controllers.GalleryCtrl');
            
            inject(['$httpBackend', function (_$httpBackend_) {
                $httpBackend = _$httpBackend_;
            }]);
        });
        
        afterEach(function () {
            $httpBackend.verifyNoOutstandingExpectation();
            $httpBackend.verifyNoOutstandingRequest();
        });
        
        var getCtrl = function (routeParams) {
            var ctrl = null;
            if (typeof routeParams === 'undefined') {
                routeParams = {userslug: 'john'};
            }
            inject(function ($controller, $rootScope) {
                scope = $rootScope.$new();
                ctrl = $controller('GalleryCtrl', {$scope: scope, $routeParams: routeParams});
            });
            
            return ctrl;
        };
        
        describe('[setup]', function () {
            
            it('should request public images immediately', function () {
                
                //$httpBackend.expectGet('/couchdb/commissar_public/')
                
                getCtrl();
                
                
            });
        });
        
        
        describe('[$routes]', function () {
            it('should have the routes defined', inject(function ($route, $location) {
                
                expect($route.current).toBeUndefined();
                
                $httpBackend.expectGET('angular/templates/gallery/index.html').respond(200, '');
                $location.path('/my/gallery');
                world.digest();
                world.flush();
                expect($location.path()).toBe('/my/gallery');
                expect($route.current).toBeDefined();
                expect($route.current.templateUrl).toBe('angular/templates/gallery/index.html');
                expect($route.current.controller).toBe('GalleryCtrl');
                
                $location.path('/someone_elses/gallery');
                world.digest();
                expect($location.path()).toBe('/someone_elses/gallery');
                expect($route.current.templateUrl).toBe('angular/templates/gallery/index.html');
                expect($route.current.controller).toBe('GalleryCtrl');
                
                $httpBackend.expectGET('angular/templates/gallery/upload.html').respond(200, '');
                $location.path('/my/gallery/upload');
                world.digest();
                world.flush();
                expect($location.path()).toBe('/my/gallery/upload');
                expect($route.current.templateUrl).toBe('angular/templates/gallery/upload.html');
                expect($route.current.controller).toBe('GalleryCtrl');
            }));
        });
        
    });
});