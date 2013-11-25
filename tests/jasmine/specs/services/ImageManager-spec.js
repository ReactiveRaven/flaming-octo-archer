/* global afterEach:false, inject:false */

define(['world'], function (world) {
    "use strict";
    
    describe('[commissar.service.ImageManager]', function () {

        var $httpBackend,
            Authentication,
            ImageManager;

        beforeEach(function () {
            module('commissar.service.ImageManager');

            inject(function (_$httpBackend_, _Authentication_, _ImageManager_) {
                $httpBackend = _$httpBackend_;
                Authentication = _Authentication_;
                ImageManager = _ImageManager_;
            });
            
            spyOn(Authentication, "getUsername").andReturn(world.resolved("john"));
        });

        afterEach(function () {
            $httpBackend.verifyNoOutstandingExpectation();
            $httpBackend.verifyNoOutstandingRequest();
        });
        
        describe('[getMyImages()]', function () {
            
            it("should be a function", function () {
                world.shouldBeAFunction(ImageManager, 'getMyImages');
            });
            
            it("Should return a promise", function () {
                var response = ImageManager.getMyImages();
                
                expect(response).toBeDefined();
                expect(response.then).toBeDefined();
                expect(typeof response.then).toBe("function");
            });
            
            it("should get our username", function () {
                ImageManager.getMyImages();
                
                expect(Authentication.getUsername).toHaveBeenCalled();
            });
            
            it("should get from couch and return the documents via promise", function () {
                
                var rows = [
                        {
                            "I am a document": true
                        }
                    ],
                    error,
                    success;
                
                $httpBackend.expectGET("/couchdb/commissar_user_john/_design/validation_user_media/_view/all").respond({
                    total_rows: 1,
                    offset: 0,
                    rows: rows
                });
                
                ImageManager.getMyImages().then(function (_s_) { success = _s_; }, function (_e_) { error = _e_; });
                
                world.digest();
                world.flush();
                
                expect(error).toBe(null);
                expect(success).toBe(rows);
            });
        });
 
    });

});