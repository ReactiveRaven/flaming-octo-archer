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

        describe('[media]', function () {

            var validDocument = {
                _id: 'john_123',
                type: 'media',
                author: 'john',
                title: 'Mona Lisa',
                created: '1378005326'
            };

            it('should allow _admin to overrule everything', function () {
                $rootScope.cornercouch.userCtx.roles = ['_admin'];
                testValidate({}, null, userDb, true, undefined);
            });

            it('should require a title and author', function () {
                testValidate(validDocument, null, userDb, true, undefined);
                var noTitle = jquery.extend({}, validDocument);
                delete noTitle.title;
                testValidate(noTitle, null, userDb, undefined, 'Media must have a title');
                var noAuthor = jquery.extend({}, validDocument);
                delete noAuthor.author;
                testValidate(noAuthor, null, userDb, undefined, 'Cannot create a document without an author field');
            });

            it('should require created timestamp', function () {
                var noCreated = jquery.extend({}, validDocument);
                delete noCreated.created;
                testValidate(noCreated, null, userDb, undefined, 'Media must have a created timestamp');
            });

            it('should restrict mediaType', function () {

                var validMediaType = jquery.extend({}, validDocument);
                for (var i = 0; i < constants.allowedMediaTypes.length; i++) {
                    validMediaType.mediaType = constants.allowedMediaTypes[i];
                    testValidate(validMediaType, null, userDb, true, undefined);
                }

                var invalidMediaType = jquery.extend({}, validDocument);
                invalidMediaType.mediaType = "wonkydonkey";
                testValidate(invalidMediaType, null, userDb, undefined, 'Invalid media type');
            });

            describe('[views]', function () {

                var Couch;

                beforeEach(inject(function (_Couch_) {
                    Couch = _Couch_;
                }));

                it("should contain a views key", function () {
                    expect(Couch._designDocs.commissar_validation_users['_design/validation_user_media'].views).toBeDefined();
                });

                describe("[all]", function () {

                    var view,
                        emit;

                    beforeEach(function () {
                        view = Couch._designDocs.commissar_validation_users['_design/validation_user_media'].views.all;
                        window.emit = emit = jasmine.createSpy("emit");
                    });

                    it("should exist", function () {
                        expect(Couch._designDocs.commissar_validation_users['_design/validation_user_media'].views.all).toBeDefined();
                    });

                    it("should emit if the document is a media-type", function () {
                        var document = {
                            type: 'media',
                            someKey: true
                        };

                        view.map(document);

                        expect(emit).toHaveBeenCalledWith(null, document);
                    });

                    it("should not emit if the document is any other type", function () {
                        var document = {
                            type: 'other',
                            someKey: true
                        };

                        view.map(document);

                        expect(emit).not.toHaveBeenCalled();
                    });
                });

                describe("[byAuthor]", function () {

                    var view,
                        emit;

                    beforeEach(function () {
                        view = Couch._designDocs.commissar_validation_users['_design/validation_user_media'].views.byAuthor;
                        window.emit = emit = jasmine.createSpy("emit");
                    });

                    it("should exist", function () {
                        expect(Couch._designDocs.commissar_validation_users['_design/validation_user_media'].views.byAuthor).toBeDefined();
                    });

                    it("should emit by author if the document is a media-type", function () {
                        var document = {
                            type: 'media',
                            someKey: true,
                            author: 'john smith'
                        };

                        view.map(document);

                        expect(emit).toHaveBeenCalledWith(document.author, document);

                        var doc2 = {
                            type: 'media',
                            someKey: true,
                            author: 'jane doe'
                        };

                        view.map(doc2);

                        expect(emit).toHaveBeenCalledWith(doc2.author, doc2);
                    });

                    it("should not emit if the document is any other type", function () {
                        var document = {
                            type: 'other',
                            someKey: true,
                            author: 'john smith'
                        };

                        view.map(document);

                        expect(emit).not.toHaveBeenCalled();
                    });
                });

                describe("[noThumbnails]", function () {

                    var view,
                        emit;

                    beforeEach(function () {
                        view = Couch._designDocs.commissar_validation_users['_design/validation_user_media'].views.noThumbnails;
                        window.emit = emit = jasmine.createSpy("emit");
                    });

                    it("should exist", function () {
                        expect(Couch._designDocs.commissar_validation_users['_design/validation_user_media'].views.noThumbnails).toBeDefined();
                    });

                    it("should emit if the document is a media-type with no thumbnails attribute", function () {
                        var document = {
                            type: 'media',
                            someKey: true,
                            author: 'john smith'
                        };

                        view.map(document);

                        expect(emit).toHaveBeenCalledWith(null, document);
                    });

                    it("should not emit if the document is any other type", function () {
                        var document = {
                            type: 'other',
                            someKey: true,
                            author: 'john smith'
                        };

                        view.map(document);

                        expect(emit).not.toHaveBeenCalled();
                    });

                    it("should not emit if the document has a thumbnails attribute", function () {
                        var document = {
                            type: 'media',
                            thumbnails: {
                                100: 'thumb_100x100.png',
                                500: 'thumb_500x500.png'
                            },
                            someKey: true,
                            author: 'john smith'
                        };

                        view.map(document);

                        expect(emit).not.toHaveBeenCalled();
                    });
                });
            });
        });
    });

});