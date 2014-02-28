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
        
        commissionManager.getCommissions = function (getCommissionsDeferred) {
            if ( typeof getCommissionsDeferred === 'undefined') {
                var getCommissionsDeferred = $q.defer();
            }
            if (typeof commissionManager.username === 'undefined') {
                Authentication.getUsername().then(function (username) {
                    commissionManager.username = username;
                    commissionManager.getCommissions(getCommissionsDeferred);
                });
            }
            else {
                var databaseName = Authentication.getDatabaseName(commissionManager.username);
                var documentUrl = '/_design/validation_user_commission/_view/all?descending=true';
                $http.get('/couchdb/' + databaseName + documentUrl)
                .success(function (data) {
                    commissionManager.commissions = data.rows.map(function (row) {
                        return row.value;
                    });
                    getCommissionsDeferred.resolve();
                })
                .error(function () {
                    getCommissionsDeferred.reject();
                });
            }
            return getCommissionsDeferred.promise;
        };
        
        commissionManager.updateCommission = function (commission) {
            var updateCommisssionDeferred = $q.defer();
            var databaseName = Authentication.getDatabaseName(commissionManager.username);
            var commissionUrl = '/couchdb/' + databaseName + '/' + commission._id;
            $http.put(commissionUrl, commission)
            .then(
                function (commissionMetaData) {
                    commission._rev = commissionMetaData.rev;
                    updateCommisssionDeferred.resolve(commission);
                },
                function () {
                    $http.get('/couchdb').then(function () {
                        $http.get(commissionUrl).then(
                            function (revisedCommission) {
                                revisedCommission.messages.u
                            },
                            function () {
                                updateCommisssionDeferred.resolve(null);
                            }
                        );
                    },
                    function () {
                        updateCommisssionDeferred.reject();
                    });
                }
            );
            
            return updateCommisssionDeferred.promise;
        };
        
        
        return commissionManager;
    });
    return CommissionManagerModule;
});