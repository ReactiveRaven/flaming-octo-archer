/* global afterEach:false, inject:false */

define([], function () {
    "use strict";

    describe('commissar.services.Couch', function () {

        var $httpBackend;

        function flush() {
            $httpBackend.flush();
        }

        beforeEach(module('commissar'));

        beforeEach(inject(function (_$httpBackend_) {
            $httpBackend = _$httpBackend_;
        }));

        afterEach(function () {
            $httpBackend.verifyNoOutstandingExpectation();
            $httpBackend.verifyNoOutstandingRequest();
        });

        describe('constructor', function () {

            it('should get a list of all databases available', function () {
                $httpBackend.whenGET('/couchdb/_all_dbs').respond(200, {});
                var Couch;
                inject(function (_Couch_) {
                    Couch = _Couch_;
                });
                $httpBackend.flush();
            });

            it('should return an object', function () {
                $httpBackend.whenGET('/couchdb/_all_dbs').respond(200, {});
                var Couch;
                inject(function (_Couch_) {
                    Couch = _Couch_;
                });
                $httpBackend.flush();

                expect(Couch).toBeDefined();
                expect(typeof Couch).toEqual('object');
            });

        });

        describe('#', function () {
            beforeEach(function () {
                $httpBackend.whenGET('/couchdb/_all_dbs').respond(200, ['_replicator', '_users', 'commissar', 'commissar_user_fish', 'commissar_user_geraldine', 'commissar_validation_global', 'commissar_validation_users']);
            });

            describe('databaseExists()', function () {

                it('should be a function', inject(function (Couch) {
                    flush();
                    expect(Couch.databaseExists).toBeDefined();
                    expect(typeof Couch.databaseExists).toEqual('function');
                }));

                it('should return true if the database exists', inject(function (Couch) {
                    flush();
                    expect(Couch.databaseExists('_users')).toEqual(true);
                    expect(Couch.databaseExists('commissar_validation_users')).toEqual(true);
                }));

                it('should return false if the database doesn\'nt exist', inject(function (Couch) {
                    flush();
                    expect(Couch.databaseExists('crazy_database_name_that_doesnt_exist')).toEqual(false);
                    expect(Couch.databaseExists('missing_database_name')).toEqual(false);
                }));

            });
        });

    });
    
});