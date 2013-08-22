/* global inject:false, afterEach:false */

define(['world', 'angular'], function (world, angular) {
    "use strict";

    var element, scope, $httpBackend, $templateCache;

    describe('[commissar.directives.LoginForm]', function () {
        beforeEach(function () {

            module('commissar.directives.LoginForm');

            inject(function (_$httpBackend_, $rootScope, _$templateCache_) {

                $httpBackend = _$httpBackend_;

                scope = $rootScope.$new();
                
                $templateCache = _$templateCache_;

            });
            
            var tpl = $templateCache.get('base/www/angular/templates/directives/LoginForm.html');
            console.log(tpl, $templateCache);
            window.lol = $templateCache;
            $templateCache.put('angular/templates/directives/LoginForm.html', tpl);
            

        });

        var compileDirective = function () {
            inject(function ($compile) {
                element = angular.element(
                        '<div data-login-form=""></div>'
                    );

                $compile(element)(scope);
                scope.$digest();
            });
        };

        afterEach(function () {
            $httpBackend.verifyNoOutstandingExpectation();
            $httpBackend.verifyNoOutstandingRequest();
        });

        it('should replace with a form element', function () {
            
            compileDirective();
            
            
            expect(element[0].tagName).toBe("form");
        });
    });
});