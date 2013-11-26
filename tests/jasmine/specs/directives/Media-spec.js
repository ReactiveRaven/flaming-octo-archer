/* global inject:false, afterEach:false */

define(['world', 'angular'], function (world, angular) {
    "use strict";

    var element,
        scope,
        $httpBackend,
        $rootScope,
        document;

    describe('[commissar.directives.Media]', function () {
        beforeEach(function () {

            module('commissar.directives.Media', 'templates');

            inject(function (_$httpBackend_, _$rootScope_) {

                $httpBackend = _$httpBackend_;
                $rootScope = _$rootScope_;

                scope = $rootScope.$new();

            });
            
            document = {
                "_id": "fish_media_1384125152165.2205",
                "_rev": "3-63b855229599d34871b860261b0ab788",
                "author": "fish",
                "type": "media",
                "mediaType": "image",
                "title": "test",
                "created": 1384125152,
                "_attachments": {
                    "20131123_172749.jpg": {
                        "content_type": "image/jpeg",
                        "revpos": 3,
                        "digest": "md5-BIkNuDCB8q8Pxf4btoEIjQ==",
                        "length": 50912,
                        "stub": true
                    },
                    "20130824_222626.jpg": {
                        "content_type": "image/jpeg",
                        "revpos": 2,
                        "digest": "md5-jiRBPeyoZ7g4XD93Z9EwFg==",
                        "length": 634266,
                        "stub": true
                    }
                }
            };

        });

        var compileDirective = function (content, html) {
            
            if (typeof html === 'undefined') {
                html = '<div data-media="" data-ng-model="content"></div>';
            }
            
            inject(function ($compile) {
                element = angular.element(
                        html
                    );
                        
                scope.content = content;

                $compile(element)(scope);
                
                scope.$apply();
            });
        };
        
        var getCtrl = function () {
            var ctrl = null;
            inject(function ($controller) {
                ctrl = $controller('commissar.directives.Media.controller', {$scope: scope});
            });
            
            return ctrl;
        };

        afterEach(function () {
            $httpBackend.verifyNoOutstandingExpectation();
            $httpBackend.verifyNoOutstandingRequest();
        });
        
        describe('[Controller]', function () {
            describe('[className()]', function () {
                it('should be a function', function () {
                    getCtrl();
                    world.shouldBeAFunction(scope, "className");
                });
                
                it('should use the media type', function () {
                    scope.document = document;
                    
                    getCtrl();
                    
                    var response = scope.className();
                    
                    expect(response).toContain('media');
                    expect(response).toContain(document.mediaType);
                });
                
                it('should not accept garbage', function () {
                    scope.document = document;
                    
                    document.mediaType = "Gibberish";
                    
                    getCtrl();
                    
                    var response = scope.className();
                    
                    expect(response).toContain('media');
                    expect(response).not.toContain(document.mediaType);
                });
            });
        });
        
        describe('[HTML]', function () {
            it('should replace with a div with class media', function () {

                compileDirective();

                expect(element[0].tagName).toBe('DIV');
                expect(element[0].className).toContain('media');
            });
        });
        
    });
});