/* global afterEach:false, inject:false, xdescribe:false */

define(['world'], function (world) {
    "use strict";
    
    xdescribe.shut_up_jshint = true;

    describe('[commissar.services.CouchValidation]', function () {

        var $httpBackend;

        beforeEach(function () {
            module('commissar.services.CouchValidation');
            inject(function (_$httpBackend_) {
                $httpBackend = _$httpBackend_;
            });
        });

        afterEach(function () {
            $httpBackend.verifyNoOutstandingExpectation();
            $httpBackend.verifyNoOutstandingRequest();
        });

        describe('[constructor]', function () {

            it('should not make unnecessary requests', inject(function (CouchValidation) {
                // no flush!
                CouchValidation.shut_up_jshint = true;
            }));

            it('should return an object', inject(function (CouchValidation) {
                expect(CouchValidation).toBeDefined();
                expect(typeof CouchValidation).toEqual('object');
            }));

        });
        
        describe('[functions]', function () {
            describe('[testDocUpdate()]', function () {
                it('should check the documents property', inject(function (CouchValidation) {
                    CouchValidation.documents = [{
                        validate_doc_update: function () {
                            
                        }
                    }];
                    spyOn(CouchValidation.documents[0], "validate_doc_update");
                    
                    CouchValidation.testDocUpdate();
                    
                    expect(CouchValidation.documents[0].validate_doc_update).toHaveBeenCalled();
                }));
            });
        });
        
        describe('[validation]', function () {
            describe('[should block]', function () {
                var userCtx,
                    CouchValidation;
                
                beforeEach(inject(function (_CouchValidation_) {
                    CouchValidation = _CouchValidation_;
                    userCtx = {
                        name: "john",
                        roles: [],
                        db: "name_of_database"
                    };
                }));
                
                it("should block documents without a type", function () {
                    
                    var doc = {
                            id: "an_id",
                            author: userCtx.name
                        },
                        oldDoc;
                    
                    
                    expect(
                        CouchValidation.testDocUpdate(
                            doc,
                            oldDoc,
                            userCtx
                        )
                    ).toEqual({
                        forbidden: 'All documents must have a type'
                    });
                });
                
                it("should block documents with a different existing author", function () {
                    var doc = {
                            id: "an_id",
                            author: userCtx.name,
                            type: "something"
                        },
                        oldDoc = {
                            id: "an_id",
                            author: "sarah",
                            type: "something"
                        };
                    
                    expect(CouchValidation.testDocUpdate(doc, oldDoc, userCtx)).toEqual({
                        forbidden: 'This document is owned by ' + oldDoc.author
                    });
                });
                
                it("should block spoofing author", function () {
                    var doc = {
                            id: "an_id",
                            author: "sarah",
                            type: "something"
                        },
                        oldDoc = {
                            id: "an_id",
                            author: "sarah",
                            type: "something"
                        };
                        
                    expect(CouchValidation.testDocUpdate(doc, oldDoc, userCtx)).toEqual({
                        forbidden: 'Author should be: ' + userCtx.name
                    });
                });
                
                it("should block creating documents outside own DB", function () {
                    var doc = {
                            id: "an_id",
                            author: "john",
                            type: "something"
                        },
                        oldDoc = null;
                    
                    expect(CouchValidation.testDocUpdate(doc, oldDoc, userCtx)).toEqual({
                        forbidden: 'Cannot create a document outside of your database - try again in commissar_user_' + userCtx.name
                    });
                    
                    userCtx.db = "commissar_user_" + userCtx.name;
                    
                    expect(CouchValidation.testDocUpdate(doc, oldDoc, userCtx)).toEqual(true);
                });
            });
        });

    });
    
});