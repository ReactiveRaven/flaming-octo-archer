/* global afterEach:false, inject:false */

define(['world', 'jquery'], function (world, jquery) {
    "use strict";
    
    describe('[commissar.services.Couch Design Documents]', function () {

        var $httpBackend,
            $rootScope,
            validDocument = {
                _id: 'john_123',
                type: 'some_type',
                author: 'john'
            },
            globalDb = 'commissar_public',
            userDb = 'commissar_user_john',
            testValidate = function (newDoc, oldDoc, db, resolve, reject) {

                var success,
                    failure;

                var functions = {
                        'success': function (_success_) {
                            success = _success_;
                        },
                        'failure': function (_failure_) {
                            failure = _failure_;
                        }
                    };

                spyOn(functions, 'success').andCallThrough();
                spyOn(functions, 'failure').andCallThrough();

                inject(function (Couch) {
                    Couch.validateDoc(newDoc, oldDoc, db).then(functions.success, functions.failure);
                });

                world.digest();

                var calls = functions.success.callCount + functions.failure.callCount;

                expect(calls).toBe(1);
                expect(success).toBe(resolve);
                expect(failure).toBe(reject);
            };


        

        beforeEach(function () {
            module('commissar.services.Couch');
            inject(function (_$httpBackend_) {
                $httpBackend = _$httpBackend_;
            });

            $httpBackend.whenGET(
                '/couchdb/_session'
            ).respond(
                200,
                {
                    ok: true,
                    userCtx: {name: 'john', roles: ['user']},
                    info: {authentication_db: '_users', authentication_handlers: ['oauth', 'cookie', 'default']}
                }
            );

            inject(function (_$rootScope_) {
                $rootScope = _$rootScope_;
                $rootScope.cornercouch = {
                    userCtx: {
                        name: 'john',
                        roles: []
                    }
                };
            });
        });

        afterEach(function () {
            $httpBackend.verifyNoOutstandingExpectation();
            $httpBackend.verifyNoOutstandingRequest();
        });

        it('should have a key containing expected view documents', inject(function (Couch) {
            expect(Couch._designDocs).toBeDefined();
        }));

        describe('[global]', function () {
            it('should have keys for global view documents', inject(function (Couch) {
                expect(Couch._designDocs.commissar_validation_global).toBeDefined();
            }));

            it('should allow _admin to overrule everything', function () {
                $rootScope.cornercouch.userCtx.roles = ['_admin'];
                testValidate({}, null, globalDb, true, undefined);
            });

            it('should reject documents without a type', function () {
                var noType = jquery.extend({}, validDocument);
                delete noType.type;

                testValidate(noType, null, globalDb, undefined, 'All documents must have a type');
            });

            it('should allow deleted documents', function () {
                var deleted = {
                    '_id': validDocument['_id'],
                    '_deleted': true
                };

                testValidate(deleted, validDocument, globalDb, true, undefined);
            });

            it('should not allow writes outside your own db unless admin', inject(function ($rootScope) {
                testValidate(validDocument, null, globalDb, undefined, 'Cannot alter documents outside your own database');
                $rootScope.cornercouch.userCtx.roles = ['+admin'];
                testValidate(validDocument, null, globalDb, true, undefined);
            }));

            it('should reject created timestamp in anything but unix timestamp', function () {
                var badCreated = jquery.extend({}, validDocument);
                badCreated.created = "2000-01-01 00:00:00";
                testValidate(badCreated, null, userDb, undefined, 'Created timestamp must be in unix format');
            });

            it('should reject when changing created time unless admin', function () {
                var firstCreated = jquery.extend({}, validDocument);
                firstCreated.created = "12345";
                var secondCreated = jquery.extend({}, validDocument);
                secondCreated.created = "12346";
                testValidate(secondCreated, firstCreated, userDb, undefined, 'Cannot alter created timestamp once set');
            });

            it('should reject updated timestamp in anything but unix timestamp', function () {
                var badUpdated = jquery.extend({}, validDocument);
                badUpdated.updated = "2000-01-01 00:00:00";
                testValidate(badUpdated, null, userDb, undefined, 'Updated timestamp must be in unix format');
            });
        });
    });

});