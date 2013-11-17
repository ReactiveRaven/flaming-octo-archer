/* global inject:false, afterEach:false, jQuery:false */

define(['world', 'angular'], function (world, angular) {
    "use strict";

    var element,
        scope,
        $httpBackend,
        $templateCache,
        $rootScope;

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
                
                var ParanoidScope;
                
                beforeEach(inject(function (_ParanoidScope_) {
                    ParanoidScope = _ParanoidScope_;
                    getCtrl();
                }));
                
                it('should be a function', function () {
                    world.shouldBeAFunction(scope, 'fileChanged');
                });
                
                it('should attach save the \'files\' object to the scope', function () {
                    
                    spyOn(scope, "$apply").andCallFake(function (func) { func(); });
                    
                    var files = {'here are some files': true};
                    scope.fileChanged({}, [{files: files}]);
                    
                    expect(scope.uploadFormFile).toBe(files);
                    
                    expect(scope.$apply).toHaveBeenCalled();
                    
                });
                
            });
            
            describe('[valid()]', function () {
                
                beforeEach(function () {
                    scope.uploadFormName = 'kittens';
                    scope.uploadFormFile = ['/kittens.png'];
                    
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
            
            describe('[upload()]', function () {
                
                var Couch,
                    Authentication,
                    document,
                    Random;
                
                beforeEach(inject(function (_Couch_, _Authentication_, _Random_) {
                    Couch = _Couch_;
                    Authentication = _Authentication_;
                    Random = _Random_;
                    
                    scope.uploadFormName = 'kittens';
                    scope.uploadFormFile = ['/kittens.png'];
                    
                    getCtrl();
                    
                    spyOn(scope, "valid").andReturn(true);
                    
                    spyOn(Authentication, "loggedIn").andReturn(world.resolved(true));
                    spyOn(Authentication, "getUsername").andReturn(world.resolved("john"));
                    
                    document = {
                        save: jasmine.createSpy("save").andReturn(world.resolved(true)),
                        attach: jasmine.createSpy("attach").andReturn(world.resolved(true))
                    };
                    spyOn(Couch, "newDoc").andReturn(world.resolved(document));
                    spyOn(Couch, "saveDoc").andReturn(world.resolved(true));
                    
                    spyOn(Random, "getHash").andReturn("D34DB33F");
                }));
                
                it('should be a function', function () {
                    world.shouldBeAFunction(scope, 'upload');
                });
                
                it('should return a promise', function () {
                    var reply = scope.upload();
                    
                    expect(reply).toBeDefined();
                    expect(reply.then).toBeDefined();
                    expect(typeof reply.then).toBe('function');
                });
                
                it('should check if valid', function () {
                    scope.valid.andReturn(false);
                    
                    var success = null,
                        error = null;
                    
                    scope.upload().then(function (_s_) { success = _s_; }, function (_e_) { error = _e_; });
                    
                    world.digest();
                    
                    expect(scope.valid).toHaveBeenCalled();
                    expect(success).toBe(null);
                    expect(error).toBe("Not valid");
                });
                
                it('should call Random to generate the id', function () {
                    scope.upload();
                    world.digest();
                    
                    expect(Random.getHash).toHaveBeenCalled();
                });
                
                it('should create and save a document and attach the file', function () {
                    scope.upload();
                    
                    world.digest();
                    
                    expect(Couch.newDoc).toHaveBeenCalledWith('commissar_user_john');
                    expect(document._id).toBe('john_media_D34DB33F');
                    expect(document.type).toBe('media');
                    expect(document.mediaType).toBe('image');
                    expect(document.title).toBe(scope.uploadFormName);
                    expect(Couch.saveDoc).toHaveBeenCalledWith(document, 'commissar_user_john');
                    expect(document.attach).toHaveBeenCalled();
                });
            });
            
        });
        
    });
});