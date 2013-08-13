/* globals browser:false, element:false */

define([], function () {
    'use strict';
    
    beforeEach(function () {
        browser().navigateTo('/');
    });
    
    describe('[Menus]', function () {
        var menuArtistToggle,
            menuArtistDropdown,
            menuOffersToggle,
            menuOffersDropdown,
            menuLeftToggles;
        
        beforeEach(function () {
            menuArtistToggle = element('#menuArtistToggle:visible', 'Artist menu toggle');
            menuArtistDropdown = element('#menuArtistDropdown:visible', 'Artist menu dropdown');
            menuOffersToggle = element('#menuOffersToggle:visible', 'Offers menu toggle');
            menuOffersDropdown = element('#menuOffersDropdown:visible', 'Offers menu dropdown');
            menuLeftToggles = element('.navbar .nav:not(.pull-right):visible a.dropdown-toggle:visible', 'Left hand menu toggles');
        });
        
        describe('[Left]', function () {
            
            it('should open menus when clicked', function () {
                expect(menuArtistDropdown.count()).toBe(0);
                expect(menuOffersDropdown.count()).toBe(0);
                menuArtistToggle.click();
                expect(menuArtistDropdown.count()).toBe(1);
                menuOffersToggle.click();
                expect(menuArtistDropdown.count()).toBe(0);
                expect(menuOffersDropdown.count()).toBe(1);
            });
            
            describe('[logged out]', function () {

                it('should show default menus', function () {
                    expect(menuArtistToggle.count()).toBe(1);
                    expect(menuOffersToggle.count()).toBe(1);
                    expect(menuLeftToggles.count()).toBe(2);
                });
                
            });

            describe('[logged in]', function () {
                
                it('should show logged in menus', function () {
                    
                });
                
            });
        });
        
    });
    
});