/* globals browser:false, element:false, input:false */

define([], function () {
    'use strict';
    
    describe('[Gallery]', function () {
        var menuArtistToggle,
            menuArtistDropdown,
            menuOffersToggle,
            menuOffersDropdown,
            menuLeftToggles,
            menuLoginFormSelector,
            menuLoginToggle,
            menuLoginButtonLogin,
            menuLoginButtonSignup,
            menuLoginButtonSignupDisabled,
            menuLoginButtonForgot,
            menuLoginMessageRegisterSuccess,
            menuMyAccountToggle,
            menuMyAccountDropdown,
            menuMyAccountItemGallery,
            galleryButtonUpload;
            
        beforeEach(function () {
            menuArtistToggle = element('#menuArtistToggle:visible', 'Artist menu toggle');
            menuArtistDropdown = element('#menuArtistDropdown:visible', 'Artist menu dropdown');
            menuOffersToggle = element('#menuOffersToggle:visible', 'Offers menu toggle');
            menuOffersDropdown = element('#menuOffersDropdown:visible', 'Offers menu dropdown');
            menuLeftToggles = element('.navbar .nav:not(.pull-right):visible a.dropdown-toggle:visible', 'Left hand menu toggles');
            menuLoginFormSelector = element('#menuLoginForm:visible', 'Menu login form');
            menuLoginToggle = element('#menuLoginToggle:visible', 'Login Toggle');
            menuLoginButtonLogin = element('#menuLoginForm:visible button.btn-primary:visible', 'Log in button');
            menuLoginButtonSignup = element('#menuLoginForm:visible button.btn-success:visible', 'Active sign up button');
            menuLoginButtonSignupDisabled = element('#menuLoginFormButtonSignupDisabled:visible', 'Disabled sign up button');
            menuLoginButtonForgot = element('#menuLoginFormButtonForgot:visible', 'Forgot password button');
            menuLoginMessageRegisterSuccess = element('#menuLoginFormMessageRegisterSuccess:visible', 'Registration confirmation message');
            menuMyAccountToggle = element('#menuMyAccountToggle:visible', 'My account menu toggle');
            menuMyAccountDropdown = element('#menuMyAccountDropdown:visible', 'My account menu dropdown');
            menuMyAccountItemGallery = element('#menuMyAccountItemGallery:visible', 'My Gallery menu item');
            galleryButtonUpload = element('#galleryButtonUpload:visible', 'Gallery upload button');
        });
        
        function reset() {
            it('should start off on the test page, logged in', function () {
                browser().navigateTo('/index_e2e.html');
                expect(menuMyAccountToggle.count()).toBe(0);
                menuLoginToggle.click();
                input('loginFormUsername').enter('john');
                input('loginFormPassword').enter('password');
                menuLoginButtonLogin.click();
                expect(menuMyAccountToggle.count()).toBe(1);
                expect(menuLoginToggle.count()).toBe(0);
            });
        }
        
        reset();
        
        it('should show up in the my account menu', function () {
            expect(menuMyAccountItemGallery.count()).toBe(0);
            menuMyAccountToggle.click();
            expect(menuMyAccountItemGallery.count()).toBe(1);
            menuMyAccountToggle.click();
            expect(menuMyAccountItemGallery.count()).toBe(0);
        });
        
        it('should be on gallery page after clicking \'gallery\' in my account menu', function () {
            expect(browser().location().url()).toBe('/');
            menuMyAccountToggle.click();
            menuMyAccountItemGallery.click();
            expect(browser().location().url()).toBe('/my/gallery');
        });
        
        it('should have an upload button on the gallery page', function () {
            expect(galleryButtonUpload.count()).toBe(1);
        });
        
    });
    
});