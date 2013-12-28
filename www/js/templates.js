define([], function () {return function (app) {app.run(['$templateCache',function($templateCache) {   'use strict';

  $templateCache.put('angular/templates/admin.html',
    "<h1 id=\"adminPanelTitle\">Admin Panel</h1>\n" +
    "\n" +
    "<a id=\"adminPanelLinkUploadDesignDocs\" data-ng-click=\"pushDesignDocs()\" data-ng-show=\"!pushingDesignDocs\" class=\"btn btn-danger\">Push Design Documents</a>\n" +
    "\n" +
    "<div class='alert alert-danger' data-ng-bind='pushDesignDocsErrors' data-ng-show='!pushingDesignDocs && pushDesignDocsErrors'></div>\n" +
    "\n" +
    "<a id=\"adminPanelLinkGotoFuton\" data-ng-show=\"!pushingDesignDocs\" href=\"/couchdb/_utils/\" class=\"btn btn-danger\">Go to Futon</a>"
  );


  $templateCache.put('angular/templates/index.html',
    "Hello :)"
  );


  $templateCache.put('angular/templates/logout.html',
    "<h1>You are now logged out</h1>"
  );


  $templateCache.put('angular/templates/welcome.html',
    "<h1 id=\"welcomeTitle\">Welcome!</h1>"
  );
 }]);};});