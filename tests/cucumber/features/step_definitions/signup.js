module.exports = function () {
    "use strict";

    this.Given(/^I am not logged in$/, function (callback) {
        // express the regexp above with the code you wish you had
        if (this.browser.findElement(this.By.id('menuLoginToggle')).isDisplayed()) {
            callback();
        } else {
            callback.pending("don't know how to log out yet");
        }
    });

    this.When(/^I click the sign up and login menu item$/, function (callback) {
        this.browser.findElement(this.By.id('menuLoginToggle')).click();
        callback();
    });

    this.When(/^I type an unregistered username in the sign up form$/, function (callback) {
        this.browser.findElement(this.By.css('#menuLoginForm input[placeholder="username"]')).sendKeys('a_username_never_used_before');
        callback();
    });
    
    this.Then(/^the sign up button should be available$/, function (callback) {
        var self = this;
        this.browser.findElement(self.By.id('menuLoginFormButtonSignup')).isDisplayed().then(function (result) {
            self.assert.equal(result, true);
            self.browser.findElement(self.By.id('menuLoginFormButtonSignupDisabled')).isDisplayed().then(function (result) {
                self.assert.equal(result, false);
                callback();
            });
        });
    });
    
    this.Then(/^the sign up button should not be available$/, function (callback) {
        var self = this;
        this.browser.findElement(self.By.id('menuLoginFormButtonSignup')).isDisplayed().then(function (result) {
            self.assert.equal(result, false);
            self.browser.findElement(self.By.id('menuLoginFormButtonSignupDisabled')).isDisplayed().then(function (result) {
                self.assert.equal(result, true);
                callback();
            });
        });
    });
    
    this.When(/^I type a password in the sign up form$/, function (callback) {
        this.browser.findElement(this.By.css('#menuLoginForm input[placeholder="password"]')).sendKeys('a_password_never_used_before');
        callback();
    });
    
    this.When(/^I click to sign up$/, function (callback) {
        this.browser.findElement(this.By.id('menuLoginFormButtonSignup')).click();
        callback();
    });

};