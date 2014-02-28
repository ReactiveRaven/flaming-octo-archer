/* globals angular:false */
define(['./Authentication', './Couch'], function () {
    "use strict";
    
    var CommissionManagerModule = angular.module(
        'commissar.services.CommissionManager',
        [
            'commissar.services.Authentication',
            'commissar.services.Couch'
        ]
    );
    
    CommissionManagerModule.factory('CommissionManager', function (Authentication, Couch, $q, $http) {
        var commissionManager = {};
        commissionManager.commissions = [];
        commissionManager.username = undefined;
        
        commissionManager.getUsername = function () {
            var getUsernameDeferred = $q.defer();
            if (typeof commissionManager.username === 'undefined') {
                Authentication.getUsername().then(
                    function (username) {
                        commissionManager.username = username;
                        getUsernameDeferred.resolve(commissionManager.username);
                    },
                    getUsernameDeferred.reject
                );
            }
            else getUsernameDeferred.resolve(commissionManager.username);
        }
        
        commissionManager.getCommissions = function () {
            var getCommissionsDeferred = $q.defer();

            commissionManager.getUsername().then(function () {
                var databaseName = Authentication.getDatabaseName(commissionManager.username);
                var documentUrl = '/_design/validation_user_commission/_view/all?descending=true';
                $http.get('/couchdb/' + databaseName + documentUrl).then(function (data) {
                    commissionManager.commissions = data.rows.map(function (row) {
                        return row.value;
                    });
                    getCommissionsDeferred.resolve();
                }, getCommissionsDeferred.reject);    
            , getCommissionsDeferred.reject);
            
            return getCommissionsDeferred.promise;
        };
                
        commissionManager.addReplyToCommission = function (commission, replyBody) {
            var addReplyDeferred = $q.defer();
            
            commissionManager.getUsername().then(function () {
                var replyMessage = {
                    id: new Date().getTime(),
                    type: 'message'
                    created: new Date().getTime() / 1000 | 0,
                    body: replyBody,
                };
            
                var databaseName = Authentication.getDatabaseName(commissionManager.username);
                var messageUrl = '/couchdb/' + databaseName + '/' + replyMessage.id;
                $http.post(commissionUrl, commission).then(function () {
                        
                }, function () {
            
                });
            });
            
            return addReplyDeferred.promise;
        };
        
        return commissionManager;
    });
    
    return CommissionManagerModule;
});