/* globals inject:false */

define('world', ['angular', 'angularCookies', 'angularMocks'], function () {
    'use strict';
    
    return {
        'flush': function () {
            inject(['$httpBackend', function ($httpBackend) {
                $httpBackend.flush();
            }]);
        },
        'resolved': function (value) {
            var $q,
                deferred;
            inject(function (_$q_) {
                $q = _$q_;
            });

            deferred = $q.defer();
            deferred.resolve(value);

            return deferred.promise;
        },
        'rejected': function (value) {
            var $q,
                deferred;
            inject(function (_$q_) {
                $q = _$q_;
            });

            deferred = $q.defer();
            deferred.reject(value);

            return deferred.promise;
        },
        'digest': function () {
            inject(function ($rootScope) {
                $rootScope.$digest();
            });
        }
    };
});