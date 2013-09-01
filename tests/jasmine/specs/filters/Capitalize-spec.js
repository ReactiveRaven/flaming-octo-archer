/* global inject:false */

define(['world', 'angular'], function (world) {
    "use strict";
    
    world.shut_up_jshint = true;

    describe('[commissar.filters.Capitalize]', function () {
        beforeEach(function () {

            module('commissar.filters.Capitalize');

        });

        it('should capitalize first letter of text', inject(function (CapitalizeFilter) {
            expect(CapitalizeFilter('john')).toBe('John');
        }));
        
        it('should return null on empty input', inject(function (CapitalizeFilter) {
            expect(CapitalizeFilter()).toBe(null);
        }));
        
    });
});