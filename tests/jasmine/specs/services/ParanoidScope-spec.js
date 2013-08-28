/* global afterEach:false, inject:false */

define(['world'], function (world) {
    "use strict";
    world.shut_up_jshint = true;

    describe('[commissar.services.ParanoidScope]', function () {

        var $httpBackend;

        beforeEach(function () {
            module('commissar.services.ParanoidScope');
            inject(function (_$httpBackend_) {
                $httpBackend = _$httpBackend_;
            });
        });

        afterEach(function () {
            $httpBackend.verifyNoOutstandingExpectation();
            $httpBackend.verifyNoOutstandingRequest();
        });

        describe('[constructor]', function () {

            it('should not make unnecessary requests', inject(function (ParanoidScope) {
                // no flush!
                ParanoidScope.shut_up_jshint = true;
            }));

            it('should return an object', inject(function (ParanoidScope) {
                expect(ParanoidScope).toBeDefined();
                expect(typeof ParanoidScope).toBe('object');
            }));

        });

        describe('[functions]', function () {
            
            var ParanoidScope, $rootScope, scope;

            beforeEach(inject(function(_ParanoidScope_, _$rootScope_) {
                ParanoidScope = _ParanoidScope_;
                $rootScope = _$rootScope_;
                scope = $rootScope.$new();
            }));

            describe('[apply()]', function () {

                it('should be a function', function () {
                    world.shouldBeAFunction(ParanoidScope, 'apply');
                });
                
                it('should not apply when local phase is in progress', function () {
                    var func = function () { };
                    
                    spyOn(scope, '$apply').andReturn(true);
                    scope.$$phase = "$apply";
                    
                    ParanoidScope.apply(scope, func);
                    
                    expect(scope.$apply).not.toHaveBeenCalled();
                });
                
                it('should not apply when root phase is in progress', function () {
                    var func = function () { };
                    
                    spyOn(scope, '$apply').andReturn(true);
                    scope.$root.$$phase = 'apply';
                    
                    ParanoidScope.apply(scope, func);
                    
                    expect(scope.$apply).not.toHaveBeenCalled();
                });
                
                it('should apply when not in a phase', function () {
                    var func = function () { };
                    
                    spyOn(scope, '$apply').andReturn(true);
                    
                    ParanoidScope.apply(scope, func);
                    
                    expect(scope.$apply).toHaveBeenCalledWith(func);
                });

            });

            describe('[digest()]', function () {

                it('should be a function', function () {
                    world.shouldBeAFunction(ParanoidScope, 'digest');
                });
                
                it('should not digest when local phase is in progress', function () {
                    var func = function () { };
                    
                    spyOn(scope, '$digest').andReturn(true);
                    scope.$$phase = "$digest";
                    
                    ParanoidScope.digest(scope, func);
                    
                    expect(scope.$digest).not.toHaveBeenCalled();
                });
                
                it('should not digest when root phase is in progress', function () {
                    var func = function () { };
                    
                    spyOn(scope, '$digest').andReturn(true);
                    scope.$root.$$phase = 'digest';
                    
                    ParanoidScope.digest(scope, func);
                    
                    expect(scope.$digest).not.toHaveBeenCalled();
                });
                
                it('should digest when not in a phase', function () {
                    var func = function () { };
                    
                    spyOn(scope, '$digest').andReturn(true);
                    
                    ParanoidScope.digest(scope, func);
                    
                    expect(scope.$digest).toHaveBeenCalledWith(func);
                });

            });
            
        });

    });
    
});