/* global afterEach:false, inject:false */

define([], function () {
    "use strict";
    
    describe('commissar.services.Authentication', function () {

        var $httpBackend;

        function flush() {
            $httpBackend.flush();
        }

        beforeEach(function () {
            module('commissar');

            inject(function (_$httpBackend_) {
                $httpBackend = _$httpBackend_;
                $httpBackend.whenGET('/couchdb/_all_dbs').respond(200, ['_replicator', '_users', 'commissar', 'commissar_user_fish', 'commissar_user_geraldine', 'commissar_validation_global', 'commissar_validation_users']);
            });
        });

        afterEach(function () {
            $httpBackend.verifyNoOutstandingExpectation();
            $httpBackend.verifyNoOutstandingRequest();
        });

        describe('constructor', function () {
            it('should be a singleton', function () {
                var AuthA, AuthB;

                inject(function (Authentication) {
                    AuthA = Authentication;
                });
                inject(function (_Authentication_) {
                    AuthB = _Authentication_;
                });

                flush();

                expect(AuthB.test_property).not.toBeDefined();

                AuthA.test_property = "hello";

                expect(AuthB.test_property).toBeDefined();
                expect(AuthB.test_property).toEqual(AuthA.test_property);
            });
        });

        describe('#', function () {
            beforeEach(function () {
            });

            describe('userExists()', function () {

                it('should be a function', inject(function (Authentication) {
                    flush();
                    expect(Authentication.userExists).toBeDefined();
                    expect(typeof Authentication.userExists).toEqual('function');
                }));

                it('should return true if the user exists', inject(function (Authentication) {
                    flush();
                    expect(Authentication.userExists('geraldine')).toEqual(true);
                    expect(Authentication.userExists('fish')).toEqual(true);
                }));

                it('should return false if the user does not exist', inject(function (Authentication) {
                    flush();
                    expect(Authentication.userExists('frank')).toEqual(false);
                    expect(Authentication.userExists('susan')).toEqual(false);
                }));

            });
        });

    });

});