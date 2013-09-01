/* global inject:false, afterEach:false */

define(['world', 'angular'], function (world, angular) {
    "use strict";

    var element, scope, $httpBackend, $templateCache, $rootScope;

    describe('[commissar.directives.UploadForm]', function () {
        beforeEach(function () {

            module('commissar.directives.UploadForm', 'templates');
            module('commissar.directives.UploadForm', function () {});

            inject(function (_$httpBackend_, _$rootScope_, _$templateCache_) {

                $httpBackend = _$httpBackend_;
                $templateCache = _$templateCache_;
                $rootScope = _$rootScope_;

                scope = $rootScope.$new();

            });

        });

        var compileDirective = function () {
            inject(function ($compile) {
                element = angular.element(
                        '<div data-upload-form=""></div>'
                    );

                $compile(element)(scope);
                
                scope.$apply();
            });
        };
        
        var getCtrl = function () {
            var ctrl = null;
            inject(function ($controller) {
                ctrl = $controller('commissar.directives.UploadForm.controller', {$scope: scope});
            });
            
            return ctrl;
        };

        afterEach(function () {
            $httpBackend.verifyNoOutstandingExpectation();
            $httpBackend.verifyNoOutstandingRequest();
        });

        it('should replace with a form element', function () {
            
            compileDirective();
            
            expect(element[0].tagName).toBe('FORM');
        });
        
        describe('[controller]', function () {
            describe('[valid()]', function () {
                
                beforeEach(function () {
                    scope.uploadFormName = 'kittens';
                    scope.uploadFormFile = '/kittens.png';
                    
                    getCtrl();
                });
                
                it('should be a function', function () {
                    world.shouldBeAFunction(scope, 'valid');
                });
                
                it('should return false if the name is falsy', function () {
                    scope.uploadFormName = "";
                    
                    expect(scope.valid()).toBe(false);
                });
                
                it('should return false if the file element is empty', function () {
                    scope.uploadFormFile = "";
                    
                    expect(scope.valid()).toBe(false);
                });
                
                it('should return true when both inputs are okay', function () {
                    expect(scope.valid()).toBe(true);
                });
            });
            
//            describe('[upload()]', function () {
//                it('should be a function', function () {
//                    getCtrl();
//                    world.shouldBeAFunction(scope, 'upload');
//                });
//            });
        });
        
    });
});