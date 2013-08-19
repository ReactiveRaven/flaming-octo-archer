/* global afterEach:false, inject:false */

define(['world'], function (world) {
    "use strict";
    world.shut_up_jshint = true;

    describe('[commissar.services.PostSerializer]', function () {

        var $httpBackend;

        beforeEach(function () {
            module('commissar.services.PostSerializer');
            inject(function (_$httpBackend_) {
                $httpBackend = _$httpBackend_;
            });
        });

        afterEach(function () {
            $httpBackend.verifyNoOutstandingExpectation();
            $httpBackend.verifyNoOutstandingRequest();
        });

        describe('[constructor]', function () {

            it('should not make unnecessary requests', inject(function (PostSerializer) {
                // no flush!
                PostSerializer.shut_up_jshint = true;
            }));

            it('should return an object', inject(function (PostSerializer) {
                expect(PostSerializer).toBeDefined();
                expect(typeof PostSerializer).toBe('object');
            }));

        });

        describe('[functions]', function () {

            describe('[serialize()]', function () {

                it('should be a function', inject(function (PostSerializer) {
                    expect(PostSerializer.serialize).toBeDefined();
                    expect(typeof PostSerializer.serialize).toEqual('function');
                }));
                
                it('should return a serialized array when given a map', inject(function (PostSerializer) {
                    var map = {
                            username: 'john',
                            password: 'FishAndChips'
                        },
                        serialized = 'username=john&password=FishAndChips';
                        
                    expect(PostSerializer.serialize(map)).toEqual(serialized);
                }));
                
                it('should handle special characters', inject(function (PostSerializer) {
                    var map = {
                            username: 'john',
                            password: 'Fish&Chips%'
                        },
                        serialized = 'username=john&password=Fish%26Chips%25';
                        
                    expect(PostSerializer.serialize(map)).toEqual(serialized);
                }));

            });
            
        });

    });
    
});