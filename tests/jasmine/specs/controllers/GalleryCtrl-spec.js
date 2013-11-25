/* global inject:false, afterEach:false */

define(['world'], function (world) {
    "use strict";
    
    describe('[commissar.controllers.GalleryCtrl]', function () {
        
        var scope,
            $httpBackend,
            Authentication,
            routeParams,
            ImageManager,
            rows;
        
        beforeEach(function () {
            module('commissar.controllers.GalleryCtrl');
            
            inject(function (_$httpBackend_, _Authentication_, _ImageManager_) {
                $httpBackend = _$httpBackend_;
                Authentication = _Authentication_;
                ImageManager = _ImageManager_;
            });
            
            rows = [
                {
                    "id":"fish_media_1385409053266.1514",
                    "key":null,
                    "value": {
                        "_id":"fish_media_1385409053266.1514",
                        "_rev":"2-72322e1990486b1f38dd443fb481c182",
                        "author":"fish",
                        "type":"media",
                        "mediaType":"image",
                        "title":"avatar",
                        "created":1385409053,
                        "_attachments": {
                            "Burfdl-PNG.png":{
                                "content_type":"image/png",
                                "revpos":2,
                                "digest":"md5-0X4acobj7jOH03vmOaDpPQ==",
                                "length":239932,
                                "stub":true
                            }
                        }
                    }
                },
                {
                    "id":"fish_media_1385409054520.245",
                    "key":null,
                    "value": {
                        "_id":"fish_media_1385409054520.245",
                        "_rev":"2-36887fe41cb267a94b5e3ab95dc35163",
                        "author":"fish",
                        "type":"media",
                        "mediaType":"image",
                        "title":"avatar",
                        "created":1385409054,
                        "_attachments": {
                            "Burfdl-PNG.png": {
                                "content_type":"image/png",
                                "revpos":2,
                                "digest":"md5-0X4acobj7jOH03vmOaDpPQ==",
                                "length":239932,
                                "stub":true
                            }
                        }
                    }
                }
            ];
            
            spyOn(Authentication, "loggedIn").andReturn(world.resolved(true));
            spyOn(Authentication, "getUsername").andReturn(world.resolved("john"));
            spyOn(ImageManager, 'getMyImages').andReturn(world.resolved(rows));
            
            routeParams = {userslug: 'john'};
        });
        
        afterEach(function () {
            $httpBackend.verifyNoOutstandingExpectation();
            $httpBackend.verifyNoOutstandingRequest();
        });
        
        var getCtrl = function (overrideRouteParams) {
            var ctrl = null;
            if (typeof routeParams !== 'undefined') {
                routeParams = overrideRouteParams;
            }
            inject(function ($controller, $rootScope) {
                scope = $rootScope.$new();
                ctrl = $controller('GalleryCtrl', {$scope: scope, $routeParams: routeParams});
            });
            
            return ctrl;
        };
        
        describe('[setup]', function () {
            
            describe('[my gallery]', function () {
                it('should request my private images immediately and store in scope', function () {
                    // @TODO do public ones too!

                    getCtrl();
                    
                    world.digest();
                    
                    expect(ImageManager.getMyImages).toHaveBeenCalled();
                    expect(scope.images).toBe(rows);
                });
            });
        });
        
        
        describe('[$routes]', function () {
            it('should have the routes defined', inject(function ($route, $location) {
                
                expect($route.current).toBeUndefined();
                
                $httpBackend.expectGET('angular/templates/gallery/index.html').respond(200, '');
                $location.path('/my/gallery');
                world.digest();
                world.flush();
                expect($location.path()).toBe('/my/gallery');
                expect($route.current).toBeDefined();
                expect($route.current.templateUrl).toBe('angular/templates/gallery/index.html');
                expect($route.current.controller).toBe('GalleryCtrl');
                
                $location.path('/someone_elses/gallery');
                world.digest();
                expect($location.path()).toBe('/someone_elses/gallery');
                expect($route.current.templateUrl).toBe('angular/templates/gallery/index.html');
                expect($route.current.controller).toBe('GalleryCtrl');
                
                $httpBackend.expectGET('angular/templates/gallery/upload.html').respond(200, '');
                $location.path('/my/gallery/upload');
                world.digest();
                world.flush();
                expect($location.path()).toBe('/my/gallery/upload');
                expect($route.current.templateUrl).toBe('angular/templates/gallery/upload.html');
                expect($route.current.controller).toBe('GalleryCtrl');
            }));
        });
        
    });
});