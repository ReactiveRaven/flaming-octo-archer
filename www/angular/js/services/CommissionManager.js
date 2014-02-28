/* globals angular:false */
define(['./Authentication'], function () {
    "use strict";
    
    var CommissionManagerModule = angular.module(
        'commissar.services.CommissionManager',
        [
            'commissar.services.Authentication'
        ]
    );
    
    CommissionManagerModule.service('CommissionManager', function (Authentication, $q, $http) {
        var commissionManager = {};
        
        commissionManager._commissionsListing = {};
        commissionManager._repliesListing = {};
        commissionManager._confirmationRequestsListing = {};
        
        commissionManager.commissions = [];
        commissionManager.replies = [];
        commissionManager.confirmationRequests = [];
        
        commissionManager._buildDocument = function (document) {
            var deferred = $q.defer();
            
            Authentication.getUsername().then(function (username) {
                var createdTimeAsMs = new Date().getTime()
                var template = {
                    _id: username + '_' + document.type + '_' + createdTimeAsMs,
                    author: username,
                    createdTimeAsMs: createdTimeAsMs,
                    createdTimeAsUnixTime: createdTimeAsMs / 1000 | 0
                };
                
                document = angular.extend(document, template);
                
                deferred.resolve(document);
            }, deferred.reject);
            
            return deferred.promise;
        };
        
        
        commissionManager._databaseUrlForUsername = function (username) {
            var databaseName = Authentication.getDatabaseName(username);
            var databaseUrl = '/couchdb/' + databaseName;

            return databaseUrl;
        };
    
        commissionManager._getUrlForDocumentId = function (id) {
            var deferred = $q.defer();
            
            commissionManager._getDatabaseUrl.then(function (databaseUrl) {
                var documentUrl = databaseUrl + '/' + id;
                deferred.resolve(documentUrl);
            });

            return deferred.promise;
        };
        
        
        commissionManager._getUrlForView = function (view) {
            var deferred = $q.defer();
            var viewPath = '_view/' + view;
            
            commissionManager._getUrlForDocumentId(viewPath).then(function (url) {
                deferred.resolve(url);
            });

            return deferred.promise;
        };
        
        commissionManager._createDocument = function (document) {
            var deferred = $q.defer();
            
            commissionManager._getUsername().then(function (username) {
                
                commissionManager._buildDocument(document).then(function (template) {
                    document = angular.extend(template, document);
                    
                    commissionManager._getDatabaseUrl().then(function (url) {
                        
                        $http.post(url, document).then(function (metadata) {
                            document._rev = metadata.rev;
                            deferred.resolve(document);
                        }, deferred.reject);
                        
                    }, deferred.reject);
                    
                }, deferred.reject);
            });
            
            return deferred.promise;
        };
        
        
        commissionManager._getListingFromView = function (view) {
            var deferred = $q.defer();

            commissionManager._getUrlForView(view).then(function (url) {
                
                $http.get(url).then(deffered.resolve, deferred.reject);
                
            , deferred.reject);
            
            return deferred.promise;
        };
        
        
        commissionManager._arrayOfDocumentsFromListing = function (listing) {
            var arrayOfDocuments = listing.rows.map(function (row) {
                return row.value;
            });
            
            return arrayOfDocuments;
        };
        
        commissionManager._getCommissions = function () {
            var deferred = $q.defer();
            
            commissionManager._getListingFromView('all_commissions').then(function (listing) {
                commissionManager._commissionsListing = listing;
                commissionManager.commissions
            }, deffered.reject);
        }
        
        
        return commissionManager;
    });
    
    return CommissionManagerModule;
});