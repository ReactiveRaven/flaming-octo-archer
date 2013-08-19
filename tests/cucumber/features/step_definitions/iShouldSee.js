module.exports = function () {
    'use strict';
    
    var lookForId = function (self, id, callback) {
        self.browser.findElement(self.By.id(id)).isDisplayed().then(function (result) {
            if (result === true) {
                callback();
            } else {
                callback.fail('Couldn\'t find #' + id);
            }
        }, function () {
            callback.fail('Internal protractor stuff failed while looking for #' + id);
        });
    };
    
    this.Then(/^I should see the sign up and login form$/, function (callback) {
        lookForId(this, 'menuLoginForm', callback);
    });
    
    this.Then(/^I should see the sign up and login menu item$/, function (callback) {
        var self = this;
        this.browser.findElement(this.By.id('menuLoginToggle')).isDisplayed().then(function (result) {
            self.assert.equal(result, true);
            callback();
        });
    });
    
    this.Then(/^I should see my account details in the menu$/, function (callback) {
        lookForId(this, 'menuMyAccountToggle', callback);
    });
    
    this.Then(/^I should see my notifications in the menu$/, function (callback) {
        var self = this;
        this.browser.findElement(this.By.id('menuMyNotificationsToggle')).isDisplayed().then(function (result) {
            self.assert.equal(result, true);
            callback();
        });
    });
    
    this.Then(/^I should see my offers in the menu$/, function (callback) {
        var self = this;
        this.browser.findElement(this.By.id('menuMyOffersToggle')).isDisplayed().then(function (result) {
            self.assert.equal(result, true);
            callback();
        });
    });
    
    this.Then(/^I should see a welcome message$/, function (callback) {
        lookForId(this, 'welcomeTitle', callback);
    });

};