/* globals browser:false, element:false, input:false, sleep:false */

define([], function () {
    'use strict';
    
    beforeEach(function () {
        browser().navigateTo('/');
        sleep(0.1);
    });
    
    describe('[Signup]', function () {
        var menuLoginFormSelector = '#menuloginform:visible',
            menuLoginToggle = '.navbar .nav.pull-right li:visible a.dropdown-toggle',
            menuLoginButtonLogin = '#menuloginform:visible button.btn-primary:visible',
            menuLoginButtonSignup = '#menuloginform:visible button.btn-success:visible';
        
        it('should be at root somewhere', function () {
            expect(browser().location().url()).toBe('/');
        });
        
        it('should be signed out by default', function () {
            expect(element('.navbar .nav.pull-right li:visible a.dropdown-toggle').text()).toContain("Sign up & Log in");
        });
        
        it('signup-and-login form should be hidden initially', function () {
            expect(element(menuLoginFormSelector).count()).toBe(0);
        });
        
        it('should open the sign up form when signup-and-login menu item clicked', function () {
            expect(element(menuLoginFormSelector).count()).toBe(0);
            
            element(menuLoginToggle).click();
            
            expect(element(menuLoginFormSelector).count()).toBe(1);
        });
        
        it('should allow log in and sign up by default', function () {
            element(menuLoginToggle).click();
            
            expect(element(menuLoginButtonLogin, 'Login button').count()).toBe(1);
            expect(element(menuLoginButtonLogin + ':disabled', 'Disabled login button').count()).toBe(0);
            expect(element(menuLoginButtonSignup, 'Signup button').count()).toBe(1);
            expect(element(menuLoginButtonSignup + ':disabled', 'Disabled signup button').count()).toBe(0);
        });
        
        it('should disable signup when entered an existing username', function () {
            element(menuLoginToggle).click();
            input('loginUsername').enter('fish');
            
            expect(element(menuLoginButtonLogin, 'Login button').text()).toContain('Log in');
            expect(element(menuLoginButtonSignup, 'Sign up button').text()).toContain('Welcome back fish');
            expect(element(menuLoginButtonSignup + ':disabled', 'Disabled sign up button').count()).toBe(1);
        });
        
    });
    
});