/* global inject:false, afterEach:false */

define(['world'], function (world) {
    "use strict";
    
    describe('[commissar.controllers.AdminCtrl]', function () {
        
        var scope, $httpBackend;
        
        beforeEach(function () {
            module('commissar.controllers.AdminCtrl');
            
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
                ctrl = $controller('AdminCtrl', {$scope: scope});
            });
            
            return ctrl;
        };
        
        describe('[setup]', function () {
            it('should set the scope name', function () {
                getCtrl();

                expect(scope).toBeDefined();
                expect(scope.name).toBeDefined();
                expect(scope.name).toBe('AdminCtrl');
            });
            
            it('should set pushingDesignDocs to false', function () {
                getCtrl();
                
                expect(scope.pushingDesignDocs).toBeDefined();
                expect(scope.pushingDesignDocs).toBe(false);
            });
            
            it('should set pushDesignDocsErrors to false', function () {
                getCtrl();
                
                expect(scope.pushDesignDocsErrors).toBeDefined();
                expect(scope.pushDesignDocsErrors).toBe(false);
            });
        });
        
        
        describe('[$routes]', function () {
            it('should have the routes defined', inject(function ($route, $location) {
                
                expect($route.current).toBeUndefined();
                
                $httpBackend.expectGET('angular/templates/admin.html').respond(200, '');
                $location.path('/admin');
                world.digest();
                world.flush();
                expect($route.current).toBeDefined();
                expect($route.current.templateUrl).toBe('angular/templates/admin.html');
                expect($route.current.controller).toBe('AdminCtrl');
            }));
        });
        
        describe('[functions]', function () {
            describe('[pushDesignDocs()]', function () {
                var Couch;
                
                beforeEach(inject(function (_Couch_) {
                    Couch = _Couch_;
                    
                    spyOn(Couch, "pushDesignDocs");
                    Couch.pushDesignDocs.andReturn(world.resolved(true));
                }));
                
                it('should be a function', function () {
                    getCtrl();
                    world.shouldBeAFunction(scope, 'pushDesignDocs');
                });
                
                it('should call through to the Couch service', function () {
                    getCtrl();
                    scope.pushDesignDocs();
                    
                    expect(Couch.pushDesignDocs).toHaveBeenCalled();
                });
                
                it('should update pushingDesignDocs while pushing', function () {
                    getCtrl();
                    
                    scope.pushDesignDocs();
                    
                    expect(scope.pushingDesignDocs).toBe(true);
                    
                    world.digest();
                    
                    expect(scope.pushingDesignDocs).toBe(false);
                });
                
                it('should update pushDesignDocsErrors while pushing', function () {
                    getCtrl();
                    
                    var error = "FAKE: Too many sausages";
                    
                    Couch.pushDesignDocs.andReturn(world.rejected(error));
                    
                    scope.pushDesignDocsErrors = "Splines not reticulated";
                    
                    scope.pushDesignDocs();
                    
                    expect(scope.pushDesignDocsErrors).toBe(false);
                    
                    world.digest();
                    
                    expect(scope.pushDesignDocsErrors).toBe(error);
                });
                
            });
        });
    });
});