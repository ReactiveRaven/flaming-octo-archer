/* globals browser:false, element:false, input:false */

define([], function () {
    'use strict';
    
    describe('[Admin Panel]', function () {
        var menuLoginToggle,
            menuLoginDropdown,
            menuLoginButtonLogin,
            menuAdminToggle,
            menuAdminDropdown,
            menuAdminDropdownLinkAdminPanel,
            adminPanelTitle,
            adminPanelLinkUploadDesignDocs;
            
        beforeEach(function () {
            menuLoginToggle = element('#menuLoginToggle:visible', 'Login Toggle');
            menuLoginDropdown = element('#menuLoginDropdown:visible', 'Login Dropdown');
            menuLoginButtonLogin = element('#menuLoginForm:visible button.btn-primary:visible', 'Log in button');
            menuAdminToggle = element("#menuAdminToggle:visible", "Admin menu toggle");
            menuAdminDropdown = element("#menuAdminDropdown:visible", "Admin menu dropdown");
            menuAdminDropdownLinkAdminPanel = element("#menuAdminDropdownLinkAdminPanel:visible", "Admin Panel link in the Admin menu dropdown");
            adminPanelTitle = element("#adminPanelTitle:visible", "Admin panel title");
            adminPanelLinkUploadDesignDocs = element("#adminPanelLinkUploadDesignDocs:visible", "Admin Panel link to Upload Design Documents");
        });
        
        describe('[Options]', function () {
            it('should start off logged in as admin', function () {
                browser().navigateTo('/index_e2e.html');

                var username = 'admin';

                menuLoginToggle.click();

                input('loginFormUsername').enter(username);
                input('loginFormPassword').enter(username);

                menuLoginButtonLogin.click();
            });
            
            it('should be accessible in the admin menu', function () {
                menuAdminToggle.click();
                expect(menuAdminDropdownLinkAdminPanel.count()).toBe(1);
                menuAdminDropdownLinkAdminPanel.click();
            });

            it('should show the admin panel title', function () {
                expect(adminPanelTitle.count()).toBe(1);
            });
            
            it('should have an option to upload new design documents', function () {
                expect(adminPanelLinkUploadDesignDocs.count()).toBe(1);
            });

        });
        
    });
    
});