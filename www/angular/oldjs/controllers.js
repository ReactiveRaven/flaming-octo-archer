/* globals alert:false, angular:false, $:false */
define(['angular', 'services'], function (angular) {
    'use strict';
    
    var controllerModule = angular.module('commissar.controllers', ['commissar.services']);
    
    function addController(controllerName) {
        require(['controllers/' + controllerName], function (controller) {
            controller(controllerModule);
        });
    }
    
    var controllers = [
        'BrowseOffersCtrl',
        'CreateOfferCtrl',
        'IndexCtrl',
        'ListOffersCtrl',
        'ListPicturesCtrl',
        'MenuCtrl',
        'ViewOfferCtrl',
        'ViewPicturesCtrl'
    ];
    
    for (var i = 0; i < controllers.length; i++) {
        addController(controllers[i]);
    }
    
    return controllerModule;
});
'use strict';

/* Controllers */