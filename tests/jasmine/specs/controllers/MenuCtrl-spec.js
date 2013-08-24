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
        
        describe('[user menus]', function () {
            
            it('should listen for AuthChange', function () {
                spyOn(scope, '$on');
                
                getCtrl();
                
                expect(scope.$on).toHaveBeenCalledWith('AuthChange', scope.onAuthChange);
            });
            
            describe('[onAuthChange()]', function () {
                it('should be a function', function () {
                    getCtrl();

                    expect(scope.onAuthChange).toBeDefined();
                    expect(typeof scope.onAuthChange).toBe('function');
                });
                
                it('should cause a digest on the scope when AuthChange broadcasted', inject(function ($rootScope) {
                    getCtrl();
                    
                    spyOn(scope, '$digest');
                    
                    expect(scope.$digest).not.toHaveBeenCalled();
                    
                    $rootScope.$broadcast('AuthChange');
                    
                    expect(scope.$digest).toHaveBeenCalled();
                }));
                
                it('should not trigger an apply on AuthChange when already in progress', inject(function ($rootScope) {
                    getCtrl();
                    
                    spyOn(scope, '$digest');
                    
                    scope.$$phase = "$apply";
                    
                    $rootScope.$broadcast('AuthChange');
                    
                    expect(scope.$digest).not.toHaveBeenCalled();
                }));
            });

        });
    });
});