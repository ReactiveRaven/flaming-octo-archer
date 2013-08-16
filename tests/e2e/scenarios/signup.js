/* globals browser:false, element:false, input:false */

define([], function () {
    'use strict';
    
    beforeEach(function () {
        browser().navigateTo('/index_e2e.html');
    });
    
    describe('[Signup]', function () {
        var menuLoginFormSelector,
            menuLoginToggle,
            menuLoginButtonLogin,
            menuLoginButtonSignup,
            menuLoginButtonSignupDisabled,
            menuLoginButtonForgot,
            menuLoginMessageRegisterSuccess;
        
        beforeEach(function () {
            menuLoginFormSelector = element('#menuLoginForm:visible', 'Menu login form');
            menuLoginToggle = element('#menuLoginToggle:visible', 'Login Toggle');
            menuLoginButtonLogin = element('#menuLoginForm:visible button.btn-primary:visible', 'Log in button');
            menuLoginButtonSignup = element('#menuLoginForm:visible button.btn-success:visible', 'Active sign up button');
            menuLoginButtonSignupDisabled = element('#menuLoginFormButtonSignupDisabled:visible', 'Disabled sign up button');
            menuLoginButtonForgot = element('#menuLoginFormButtonForgot:visible', 'Forgot password button');
            menuLoginMessageRegisterSuccess = element('#menuLoginFormMessageRegisterSuccess:visible', 'Registration confirmation message');
        });
        
        it('should be at root somewhere', function () {
            expect(browser().location().url()).toBe('/');
        });
        
        it('should be signed out by default', function () {
            expect(menuLoginToggle.text()).toContain("Sign up & Log in");
        });
        
        it('signup-and-login form should be hidden initially', function () {
            expect(menuLoginFormSelector.count()).toBe(0);
        });
        
        it('should open the sign up form when signup-and-login menu item clicked', function () {
            expect(menuLoginFormSelector.count()).toBe(0);
            
            menuLoginToggle.click();
            
            expect(menuLoginFormSelector.count()).toBe(1);
        });
        
        it('should allow log in and sign up by default', function () {
            menuLoginToggle.click();
            
            expect(menuLoginButtonLogin.count()).toBe(1);
            expect(menuLoginButtonSignup.count()).toBe(1);
            expect(menuLoginButtonSignupDisabled.count()).toBe(0);
        });
        
        it('should disable signup when entered an existing username', function () {
            var username = 'fish';
            
            menuLoginToggle.click();
            input('loginFormUsername').enter(username);

            expect(menuLoginButtonLogin.text()).toContain('Log in');
            expect(menuLoginButtonSignupDisabled.text()).toContain('Already signed up!');
            expect(menuLoginButtonSignupDisabled.count()).toBe(1);
        });
        
        it('should offer \'forgot password\' when entered an existing username', function () {
            var username = 'fish';
            
            menuLoginToggle.click();
            
            expect(menuLoginButtonForgot.count()).toBe(0);
            
            input('loginFormUsername').enter(username);
            
            expect(menuLoginButtonForgot.count()).toBe(1);
            expect(menuLoginButtonForgot.text()).toContain('Forgot your password?');
            
            input('loginFormUsername').enter('');
            
            expect(menuLoginButtonForgot.count()).toBe(0);
        });
        
        it('should display a success prompt when registering', function () {
            var username = 'a_new_username';
            
            menuLoginToggle.click();
            
            expect(menuLoginButtonForgot.count()).toBe(0);
            
            input('loginFormUsername').enter(username);
            input('loginFormPassword').enter(username);
            
            menuLoginButtonSignup.click();
            
            expect(menuLoginMessageRegisterSuccess.count()).toBe(1);
        });
        
    });
    
});