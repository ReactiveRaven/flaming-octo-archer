/* global afterEach:false, inject:false */

define(['world', 'jquery', 'constants'], function (world, jquery, constants) {
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

        describe('[user]', function () {
            it('should have keys for user view documents', inject(function (Couch) {
                expect(Couch._designDocs.commissar_validation_users).toBeDefined();
            }));
            
            it('should allow _admin to overrule everything', function () {
                $rootScope.cornercouch.userCtx.roles = ['_admin'];
                testValidate({}, null, userDb, true, undefined);
            });

            it('should require an author field in your db', function () {
                var noAuthor = jquery.extend({}, validDocument);
                delete noAuthor.author;

                testValidate(noAuthor, null, userDb, undefined, 'Cannot create a document without an author field');
            });

            it('should allow skipping author field if deleting', function () {
                var noAuthor = jquery.extend({}, validDocument);
                delete noAuthor.author;
                noAuthor["_deleted"] = true;

                testValidate(noAuthor, validDocument, userDb, true, undefined);
            });

            it('should require author to match own name', function () {
                var yours = jquery.extend({}, validDocument);
                yours.author = 'susan';
                testValidate(yours, null, userDb, undefined, 'Cannot forge authorship as another user');
            });

            it('should allow forging authorship when +admin', function () {
                var yours = jquery.extend({}, validDocument);
                yours.author = 'susan';
                yours._id = 'susan_123';

                $rootScope.cornercouch.userCtx.roles.push("+admin");

                testValidate(yours, null, userDb, true, undefined);
            });

            it('should only allow the author and admins to delete documents', function () {
                var yours = jquery.extend({}, validDocument);
                var deleted = {_id: yours._id, _deleted: true};
                yours.author = "susan";

                testValidate(deleted, yours, userDb, undefined, 'Cannot delete as you are not the author');

                $rootScope.cornercouch.userCtx.roles.push("+admin");

                testValidate(deleted, yours, userDb, true, undefined);
            });

            it('should require ids to be pre-determined', function () {
                var badId = jquery.extend({}, validDocument);
                delete badId._id;
                testValidate(badId, null, userDb, undefined, 'ID is missing');
            });

            it('should require ids start with username', function () {
                var badId = jquery.extend({}, validDocument);
                badId['_id'] = 'gibberish';
                testValidate(badId, null, userDb, undefined, 'IDs must start with your username');
            });

            it('should reject changing the type field', function () {
                var typeChanged = jquery.extend({}, validDocument);
                typeChanged.type = 'newType';
                testValidate(typeChanged, validDocument, userDb, undefined, 'Cannot change the type of a document');
            });

            it('should reject changing the author field', function () {
                var susansDocument = jquery.extend({}, validDocument);
                susansDocument.author = 'susan';
                testValidate(validDocument, susansDocument, userDb, undefined, 'Cannot change the author of a document');
            });

            it('should accept well-formed documents', function () {
                testValidate(validDocument, null, userDb, true, undefined);
                testValidate(validDocument, validDocument, userDb, true, undefined);
            });
        });
    });

});