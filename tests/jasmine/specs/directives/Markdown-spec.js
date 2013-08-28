/* global inject:false, afterEach:false */

define(['world', 'angular'], function (world, angular) {
    "use strict";

    var element, scope, $httpBackend, $rootScope;

    describe('[commissar.directives.Markdown]', function () {
        beforeEach(function () {

            module('commissar.directives.Markdown');

            inject(function (_$httpBackend_, _$rootScope_) {

                $httpBackend = _$httpBackend_;
                $rootScope = _$rootScope_;

                scope = $rootScope.$new();

            });

        });

        var compileDirective = function (content, html) {
            
            if (typeof html === 'undefined') {
                html = '<div data-markdown="" data-ng-model="content"></div>';
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

        afterEach(function () {
            $httpBackend.verifyNoOutstandingExpectation();
            $httpBackend.verifyNoOutstandingRequest();
        });

        it('should set contents to the given model-content', function () {
            
            var text = 'Hello';
            
            compileDirective(text);
            
            expect(element[0].innerText).toContain(text);
        });

        it('should do links', function () {
            
            var text = 'Hello [friend](http://www.google.com)';
            
            compileDirective(text);
            
            expect(element[0].innerHTML).toContain('<a href="http://www.google.com">friend</a>');
        });

        it('should replace existing contents with the given model-content', function () {
            
            var text = 'Hello';
            
            compileDirective(text, '<div data-markdown="" data-ng-model="content">Goodbye</div>');
            
            expect(element[0].innerText).toContain(text);
            expect(element[0].innerText).not.toContain('Goodbye');
        });
        
        it('should trim to first paragraph if told to do so', function () {
            var text = 'FIRST PARAGRAPH\r\n\r\n\r\nSECOND PARAGRAPH\r\n\r\nTHIRD PARAGRAPH';
            
            compileDirective(text, '<div data-markdown="" data-firstparagraph="true" data-ng-model="content">Goodbye</div>');
            
            expect(element[0].innerText).toContain('FIRST PARAGRAPH');
            expect(element[0].innerText).not.toContain('SECOND PARAGRAPH');
            expect(element[0].innerText).not.toContain('THIRD PARAGRAPH');
        });
        
        it('should return only text when told to do so', function () {
            var text = 'fish [and](http://www.google.com) chips';
            
            compileDirective(text, '<div data-markdown="" data-textonly="true" data-ng-model="content">Goodbye</div>');
            
            expect(element[0].innerHTML).toContain('fish and chips');
            expect(element[0].innerHTML).not.toContain('google');
        });
        
        it('should return word-limited text when told to do so', function () {
            var text = "this is some text that is longer than five words";
            
            compileDirective(text, '<div data-markdown="" data-wordlimit="5" data-ng-model="content">Goodbye</div>');
            
            expect(element[0].innerText).toContain("this is some text that ...");
            expect(element[0].innerText).not.toContain("longer than five words");
        });
        
        it('should return word-limited text unchanged when told to do so and already short enough', function () {
            var text = "this is some text";
            
            compileDirective(text, '<div data-markdown="" data-wordlimit="5" data-ng-model="content">Goodbye</div>');
            
            expect(element[0].innerText).toContain("this is some text");
            expect(element[0].innerText).not.toContain("...");
        });
        
    });
});