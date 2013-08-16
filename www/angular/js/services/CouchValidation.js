define(['angular', './Couch'], function (angular) {
    'use strict';
    
    var CouchValidationModule = angular.module('commissar.services.CouchValidation', ['commissar.services.Couch']);
    
    CouchValidationModule.factory('CouchValidation', function () {
        
        var CouchValidation = {
            documents: [
                {
                    id: "_design/globalvalidation",
                    validate_doc_update: function (newDoc, oldDoc, userCtx) {
                        if (!newDoc.type) {
                            throw ({forbidden: 'All documents must have a type'});
                        }
                        if (newDoc.author && newDoc.author !== userCtx.name) {
                            throw ({forbidden: 'Author should be: ' + userCtx.name});
                        }
                        if (oldDoc && oldDoc.author && oldDoc.author !== userCtx.name) {
                            throw ({forbidden: 'This document is owned by ' + oldDoc.author});
                        }
                        if (userCtx.db && userCtx.db !== 'commissar_user_' + userCtx.name) {
                            throw ({forbidden: 'Cannot create a document outside of your database - try again in commissar_user_' + userCtx.name});
                        }
                    }
                }
            ],
            testDocUpdate: function (newDoc, oldDoc, userCtx) {
                
                var response = true;
                
                try
                {
                    for (var i = 0; i < CouchValidation.documents.length; i++) {
                        var curDoc = CouchValidation.documents[i];
                        curDoc.validate_doc_update(newDoc, oldDoc, userCtx);
                    }
                } catch (err) {
                    response = err;
                }
                
                return response;
            }
        };
        
        return CouchValidation;
    });
    
    return CouchValidationModule;
    
});