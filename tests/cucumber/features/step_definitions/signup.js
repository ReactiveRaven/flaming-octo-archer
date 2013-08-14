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

    this.Then(/^I should see the sign up and login menu item$/, function (callback) {
        this.assert(this.browser.findElement(this.By.id('menuLoginToggle')).isDisplayed(), true);
        callback();
    });

    this.When(/^I click the sign up and login menu item$/, function (callback) {
        this.browser.findElement(this.By.id('menuLoginToggle')).click();
        callback();
    });

    this.Then(/^I should see the sign up and login form$/, function (callback) {
        this.assert(this.browser.findElement(this.By.id('menuLoginForm')).isDisplayed(), true);
        callback();
    });

    this.When(/^I type an unregistered username in the sign up form$/, function (callback) {
        
        var mock_code = function () {
            /* globals angular:false */
            
            angular.module('httpBackendMock', ['ngMockE2E']).run(function ($httpBackend) {
                $httpBackend.whenGET('/couchdb/_all_dbs').respond({status: 'loggedin'});
            });
        };
        
        
        this.browser.addMockModule('httpBackendMock', mock_code);
        
        this.browser.findElement(this.By.css('#menuLoginForm input[placeholder="username"]')).sendKeys('a_username_never_used_before');
        setTimeout(function () {
            callback();
        }, 5000);
    });

};