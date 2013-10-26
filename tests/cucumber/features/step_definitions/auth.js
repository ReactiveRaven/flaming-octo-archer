module.exports = function () {
    "use strict";
    
    var world = this;
    
    var doLogout = function (callback) {
        callback.fail("Don't know how to log out yet");
    };
    
    this.Given(/^I am logged in as "([^\"]*)" with password "([^"]*)"$/, function (username, password, callback) {
        if (this.browser.findElement(this.By.id('menuLoginToggle')).isDisplayed()) {
            this.browser.findElement(this.By.id('menuLoginToggle')).click();
            this.browser.findElement(this.By.css('#menuLoginForm input[placeholder="username"]')).sendKeys(username);
            this.browser.findElement(this.By.css('#menuLoginForm input[placeholder="password"]')).sendKeys(password);
            this.browser.findElement(this.By.id('menuLoginFormButtonLogin')).click();
            callback();
        } else {
            doLogout(this.browser, callback);
        }
    });
    
    var getBySelector = function (input, callback) {
        var bySelector = world.By.id(input);
        world.browser.findElements(bySelector).then(function (results) {
            if (results.length === 1) {
                callback(bySelector);
            } else {
                bySelector = world.By.name(input);
                world.browser.findElement(bySelector).then(function (results) {
                    if (results.length === 1) {
                        callback(bySelector);
                    } else {
                        bySelector = world.By.binding(input);
                        world.browser.findElement(bySelector).then(function (results) {
                            if (results.length === 1) {
                                callback(bySelector);
                            } else {
                                        
                                bySelector = world.By.css(input);

                                world.browser.findElement(bySelector).then(function (results) {
                                    if (results.length === 1) {
                                        callback(bySelector);
                                    } else {
                                        bySelector = world.By.xpath("//*[contains(text(), '" + callback + "']");

                                        world.browser.findElement(bySelector).then(function (results) {
                                            if (results.length === 1) {
                                                callback(bySelector);
                                            } else {
                                                throw "Tried id, name, binding, css, xpath text-contents; can't find: " + input;
                                            }
                                        });
                                    }
                                });
                            }
                        });
                    }
                });
            }
        });
    };
    
    var cssElementContainsText = function (world, css, text) {
        return world.css2xpath(css) + "//*[contains(normalize-space(text()), '" + text + "')]";
    };
    
    this.Then(/^I should see "([^"]*)" in the "([^"]*)" element$/, function (text, css, callback) {
        var xpath = cssElementContainsText(this, css, text);
        this.browser.findElements(this.By.xpath(xpath)).then(function (results) {
            if (results.length > 0) {
                callback();
            } else {
                callback.fail("Could not find that using xpath " + xpath);
            }
        });
    });
    
    this.When(/^I click "([^"]*)" in the "([^"]*)" element$/, function (text, css, callback) {
        var xpath = cssElementContainsText(this, css, text);
        var self = this;
        this.browser.findElements(this.By.xpath(xpath)).then(function (results) {
            if (results.length > 0) {
                self.browser.findElement(self.By.xpath(xpath)).click();
                callback();
            } else {
                callback.fail("Could not find that using xpath " + xpath);
            }
        });
    });
    
    this.When(/^I click "([^"]*)"$/, function (input, callback) {
        getBySelector(input, function (bySelector) {
            this.browser.findElement(bySelector).click();
            callback();
        });
    });
    
    this.Then(/^the "([^"]*)" element should be visible$/, function (selector, callback) {
        this.browser.findElement(this.By.css(selector)).isDisplayed().then(function (result) {
            if (result !== true) {
                callback.fail("Element '" + selector + "' was not visible");
            } else {
                callback();
            }
        }, function () {
            callback.fail("Something went wrong inside Protractor while trying to figure out if an element was visible with selector '" + selector + "'");
        });
    });
    
    this.Given(/^I am logged in$/, function (callback) {
        if (this.browser.findElement(this.By.id('menuLoginToggle')).isDisplayed()) {
            this.browser.findElement(this.By.id('menuLoginToggle')).click();
            this.browser.findElement(this.By.css('#menuLoginForm input[placeholder="username"]')).sendKeys('a_registered_username');
            this.browser.findElement(this.By.css('#menuLoginForm input[placeholder="password"]')).sendKeys('a_registered_password');
            this.browser.findElement(this.By.id('menuLoginFormButtonLogin')).click();
            callback();
        } else {
            callback();
        }
    });

    this.Given(/^I am not logged in$/, function (callback) {
        // express the regexp above with the code you wish you had
        if (this.browser.findElement(this.By.id('menuLoginToggle')).isDisplayed()) {
            callback();
        } else {
            doLogout(this.browser, callback);
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
            if (result !== true) {
                callback.fail("Non-disabled Login button was not visible");
            }
            self.browser.findElement(self.By.id('menuLoginFormButtonSignupDisabled')).isDisplayed().then(function (result) {
                if (result !== false) {
                    callback.fail("Disabled Login button was visible");
                } else {
                    callback();
                }
            });
        });
    });
    
    this.Then(/^the sign up button should not be available$/, function (callback) {
        var self = this;
        this.browser.findElement(self.By.id('menuLoginFormButtonSignup')).isDisplayed().then(function (result) {
            if (result !== false) {
                callback.fail("Non-disabled Sign up button was visible");
            }
            self.browser.findElement(self.By.id('menuLoginFormButtonSignupDisabled')).isDisplayed().then(function (result) {
                if (result !== true) {
                    callback.fail("Disabled Sign up button was not visibile");
                } else {
                    callback();
                }
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
    
    this.When(/^I type a registered username in the sign up form$/, function (callback) {
        this.browser.findElement(this.By.css('#menuLoginForm input[placeholder="username"]')).sendKeys('john');
        callback();
    });
    
    this.When(/^I click to log in$/, function (callback) {
        this.browser.findElement(this.By.id('menuLoginFormButtonLogin')).click();
        callback();
    });

};