module.exports = function () {
    'use strict';
    
    var lookForId = function (self, selector, callback) {
        var bySelector = self.By.css(selector);
        self.browser.findElements(bySelector).then(
            function (results) {
                if (results.length <= 0) {
                    callback.fail('Could not find ' + selector);
                } else {
                    self.browser.findElement(bySelector).isDisplayed().then(function (result) {
                        if (result === true) {
                            callback();
                        } else {
                            callback.fail('Couldn\'t find ' + selector);
                        }
                    });
                }
            },
            function () {
                callback.fail('Internal protractor stuff failed while looking for ' + selector);
            }
        );
        
    };
    
    var ensureSelectorMissing = function (self, selector, callback) {
        var bySelector = self.By.css(selector);
        self.browser.findElements(bySelector).then(
            function (results) {
                if (results.length <= 0) {
                    callback();
                } else {
                    self.browser.findElement(bySelector).isDisplayed().then(function (result) {
                        if (result === true) {
                            callback.fail('Found ' + selector + ' when it shouldn\'t have been visible');
                        } else {
                            callback();
                        }
                    });
                }
            },
            function () {
                callback.fail('Internal protractor stuff failed while looking for ' + selector);
            }
        );
        
    };
    
    this.Then(/^I should see the sign up and login form$/, function (callback) {
        lookForId(this, '#menuLoginForm', callback);
    });
    
    this.Then(/^I should see the sign up and login menu item$/, function (callback) {
        lookForId(this, '#menuLoginToggle', callback);
    });
    
    this.Then(/^I should see my account details in the menu$/, function (callback) {
        lookForId(this, '#menuMyAccountToggle', callback);
    });
    
    this.Then(/^I should see my notifications in the menu$/, function (callback) {
        lookForId(this, '#menuMyNotificationsToggle', callback);
    });
    
    this.Then(/^I should see my offers in the menu$/, function (callback) {
        lookForId(this, '#menuMyOffersToggle', callback);
    });
    
    this.Then(/^I should see a welcome message$/, function (callback) {
        lookForId(this, '#welcomeTitle', callback);
    });
    
    this.Then(/^I should see my account details in the menu$/, function (callback) {
        lookForId(this, '#menuMyAccountToggle', callback);
    });
    
    this.Then(/^I should not see the sign up and login form$/, function (callback) {
        ensureSelectorMissing(this, '#menuLoginForm', callback);
    });
    
    this.Then(/^I should see an option to upload an image$/, function (callback) {
        lookForId(this, '#galleryButtonUpload', callback);
    });
    
    this.Then(/^I should see the image upload form$/, function (callback) {
        lookForId(this, '#formUpload', callback);
    });
    
    this.Then(/^I should see the submit upload button$/, function (callback) {
        lookForId(this, '#formUploadButtonSubmit', callback);
    });
    
    this.Then(/^I should see the public images$/, function (callback) {
        lookForId(this, '.image.public', callback);
    });
    
    this.Then(/^I should not see the private images$/, function (callback) {
        ensureSelectorMissing(this, '.image.private', callback);
    });

};