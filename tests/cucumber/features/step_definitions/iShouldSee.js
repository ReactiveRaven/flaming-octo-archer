module.exports = function () {
    'use strict';
    
    var lookForId = function (self, id, callback) {
        var selector = self.By.css('#' + id);
        self.browser.findElements(selector).then(
            function (results) {
                if (results.length <= 0) {
                    callback.fail('Could not find #' + id);
                } else {
                    self.browser.findElement(selector).isDisplayed().then(function (result) {
                        if (result === true) {
                            callback();
                        } else {
                            callback.fail('Couldn\'t find #' + id);
                        }
                    });
                }
            },
            function () {
                callback.fail('Internal protractor stuff failed while looking for #' + id);
            }
        );
        
    };
    
    this.Then(/^I should see the sign up and login form$/, function (callback) {
        lookForId(this, 'menuLoginForm', callback);
    });
    
    this.Then(/^I should see the sign up and login menu item$/, function (callback) {
        lookForId(this, 'menuLoginToggle', callback);
    });
    
    this.Then(/^I should see my account details in the menu$/, function (callback) {
        lookForId(this, 'menuMyAccountToggle', callback);
    });
    
    this.Then(/^I should see my notifications in the menu$/, function (callback) {
        lookForId(this, 'menuMyNotificationsToggle', callback);
    });
    
    this.Then(/^I should see my offers in the menu$/, function (callback) {
        lookForId(this, 'menuMyOffersToggle', callback);
    });
    
    this.Then(/^I should see a welcome message$/, function (callback) {
        lookForId(this, 'welcomeTitle', callback);
    });
    
    this.Then(/^I should see my account details in the menu$/, function (callback) {
        lookForId(this, 'menuMyAccountToggle', callback);
    });

};