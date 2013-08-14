module.exports = function () {
    
    this.Then(/^I should see the sign up and login form$/, function (callback) {
        var self = this;
        this.browser.findElement(this.By.id('menuLoginForm')).isDisplayed().then(function (result) {
            self.assert.equal(result, true);
            callback();
        });
    });
    
    this.Then(/^I should see the sign up and login menu item$/, function (callback) {
        var self = this;
        this.browser.findElement(this.By.id('menuLoginToggle')).isDisplayed().then(function (result) {
            self.assert.equal(result, true);
            callback();
        });
    });
    
    this.Then(/^I should see my account details in the menu$/, function (callback) {
        var self = this;
        this.browser.findElement(this.By.id('menuMyAccountToggle')).isDisplayed().then(function (result) {
            self.assert.equal(result, true);
            callback();
        });
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

};