/* global afterEach:false, inject:false */

define(['world'], function (world) {
    "use strict";
    
    world.shut_up_jshint = true;

    describe('[commissar.services.Random]', function () {

        var $httpBackend;

        beforeEach(function () {
            module('commissar.services.Random');
            inject(function (_$httpBackend_) {
                $httpBackend = _$httpBackend_;
            });
        });

        afterEach(function () {
            $httpBackend.verifyNoOutstandingExpectation();
            $httpBackend.verifyNoOutstandingRequest();
        });

        describe('[constructor]', function () {

            it('should not make unnecessary requests', function () {
                // no flush!
            });

            it('should return an object', inject(function (Random) {
                expect(Random).toBeDefined();
                expect(typeof Random).toBe('object');
            }));

        });

        describe('[functions]', function () {
            var Random;
            
            beforeEach(inject(function (_Random_) {
                Random = _Random_;
            }));
            
            describe('[getHash()]', function () {
                it('should be a function', function () {
                    world.shouldBeAFunction(Random, 'getHash');
                });
                
                it('should return a string', function () {
                    expect(typeof Random.getHash()).toBe('string');
                });
            });
        });

    });
    
});