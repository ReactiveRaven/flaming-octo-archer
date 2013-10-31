/* global inject:false, afterEach:false, jQuery:false */

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
            
            element = angular.element(
                '<div data-upload-form=""></div>'
            );

        });

        var compileDirective = function () {
            inject(function ($compile) {

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
            
            describe('[events]', function () {
                it('should trigger fileChanged function when selected file changes', function () {
                    
                    compileDirective();
                    
                    var directiveScope = element.scope();
                    spyOn(directiveScope, "fileChanged");
                    
                    var $input = jQuery(element).find('input[type=file]');
                    $input.trigger("change");
                    
                    expect(directiveScope.fileChanged).toHaveBeenCalled();
                });
            });
            
            describe('[fileChanged()]', function () {
                
                beforeEach(function () {
                    getCtrl();
                });
                
                it('should be a function', function () {
                    world.shouldBeAFunction(scope, 'fileChanged');
                });
                
                it('should log out that it isn\'t finished for now', function () {
                    spyOn(console, "log");
                    
                    scope.fileChanged();
                    
                    expect(console.log).toHaveBeenCalledWith("NOT YET IMPLEMENTED");
                });
                
            });
            
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
            
        });
        
    });
});