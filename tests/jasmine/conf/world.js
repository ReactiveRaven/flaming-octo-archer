/* globals inject:false */

define('world', ['angular', 'angularCookies', 'angularMocks'], function () {
    'use strict';
    
    function getDeferred() {
        var $q,
            deferred;
        inject(function (_$q_) {
            $q = _$q_;
        });

        deferred = $q.defer();
        
        return deferred;
    }
    
    return {
        'flush': function () {
            inject(['$httpBackend', function ($httpBackend) {
                $httpBackend.flush();
            }]);
        },
        'resolved': function (value) {
            var deferred;

            deferred = getDeferred();
            deferred.resolve(value);

            return deferred.promise;
        },
        'rejected': function (value) {
            var deferred;

            deferred = getDeferred();
            deferred.reject(value);

            return deferred.promise;
        },
        'digest': function () {
            inject(function ($rootScope) {
                $rootScope.$digest();
            });
        },
        'shouldBeAFunction': function (object, functionName) {
            expect(object).toBeDefined();
            expect(object[functionName]).toBeDefined();
            expect(typeof object[functionName]).toBe('function');
        },
        'spyOnAllFunctions': function (object) {
            for (var key in object) {
                if (object.hasOwnProperty(key) && typeof object[key] === 'function') {
                    spyOn(object, key);
                }
            }
        }
    };
});