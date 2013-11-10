/* globals browser:false, element:false, input:false */

define([], function () {
    'use strict';
    
    describe('[Menus]', function () {
        var menuArtistToggle,
            menuArtistDropdown,
            menuOffersToggle,
            menuOffersDropdown,
            menuLeftToggles,
            menuLoginToggle,
            menuLoginDropdown,
            menuLoginButtonLogin,
            menuLoginButtonSignup,
            menuAdminToggle,
            menuAdminDropdown;
            
        beforeEach(function () {
            menuArtistToggle = element('#menuArtistToggle:visible', 'Artist menu toggle');
            menuArtistDropdown = element('#menuArtistDropdown:visible', 'Artist menu dropdown');
            menuOffersToggle = element('#menuOffersToggle:visible', 'Offers menu toggle');
            menuOffersDropdown = element('#menuOffersDropdown:visible', 'Offers menu dropdown');
            menuLeftToggles = element('.navbar .nav:not(.navbar-right):visible a.dropdown-toggle:visible', 'Left hand menu toggles');
            menuLoginToggle = element('#menuLoginToggle:visible', 'Login Toggle');
            menuLoginDropdown = element('#menuLoginDropdown:visible', 'Login Dropdown');
            menuLoginButtonLogin = element('#menuLoginForm:visible button.btn-primary:visible', 'Log in button');
            menuLoginButtonSignup = element('#menuLoginForm:visible button.btn-success:visible', 'Active sign up button');
            menuAdminToggle = element("#menuAdminToggle:visible", "Admin menu toggle");
            menuAdminDropdown = element("#menuAdminDropdown:visible", "Admin menu dropdown");
        });
        
        describe('[Left]', function () {
            
            describe('[logged out]', function () {
                     
                it('should start off on the test page', function () {
                    browser().navigateTo('/index_e2e.html');
                });

                it('should show default menus', function () {
                    expect(menuArtistToggle.count()).toBe(1);
                    expect(menuOffersToggle.count()).toBe(1);
                    expect(menuLeftToggles.count()).toBe(2);
                });

            });
            
            describe('[logged in]', function () {
                it('should start off logged in as admin', function () {
                    browser().navigateTo('/index_e2e.html');

                    var username = 'admin';

                    menuLoginToggle.click();

                    input('loginFormUsername').enter(username);
                    input('loginFormPassword').enter(username);

                    menuLoginButtonLogin.click();
                });
                
                it('should show an admin menu', function () {
                    expect(menuAdminToggle.count()).toBe(1);
                    expect(menuAdminDropdown.count()).toBe(0);
                });
                
                it('should open when clicked', function () {
                    expect(menuAdminDropdown.count()).toBe(0);
                    menuAdminToggle.click();
                    expect(menuAdminDropdown.count()).toBe(1);
                });
            });
            
            it('should open menus when clicked', function () {
                expect(menuArtistDropdown.count()).toBe(0);
                expect(menuOffersDropdown.count()).toBe(0);
                menuArtistToggle.click();
                expect(menuArtistDropdown.count()).toBe(1);
                menuOffersToggle.click();
                expect(menuArtistDropdown.count()).toBe(0);
                expect(menuOffersDropdown.count()).toBe(1);
            });
        });
        
    });
    
});