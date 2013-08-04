// features/step_definitions/artist_experience.js

var signup_and_auth = function () {
    "use strict";
    
    this.World = require("../../support/world.js").World; // overwrite default World constructor

    this.Before(function (callback) {

        this.log("debug", "Starting phantom proxy");

        var self = this;

        this.phantomProxy.create({'port': 1061}, function (proxy) {
            self.proxy = proxy;
            self.page = proxy.page;
            callback();
        });
    });

    this.After(function (callback) {
        this.log("debug", "Closing phantom proxy");
        this.proxy.end(callback);
    });

    this.Given(/^I am (not logged in|not signed in|signed out|logged out)$/, function (match, callback) {
        this.open("http://test.commissar.dev/logout", callback);
    });

    this.Given(/^I am signed in as an? (commissioner|artist)$/, function (usertype, callback) {
        if (usertype === "commissioner") {
            callback.pending(/**/"need to set up creating a commissioner account"/**/);
        } else if (usertype === "artist") {
            callback.pending(/**/"need to set up creating an artist account"/**/);
        } else {
            callback.fail("Unexpected user type");
        }
    });

    this.When(/^I visit the site$/, function (callback) {
        this.open("http://test.commissar.dev/", callback);
    });

    this.Then(/^I should see the artist sign up form$/, function (callback) {
        // express the regexp above with the code you wish you had
        callback.pending();
    });

    this.Given(/^I am not registered$/, function (callback) {
        // express the regexp above with the code you wish you had
        callback.pending();
    });

    this.When(/^I fill in the artist sign up form$/, function (callback) {
        // express the regexp above with the code you wish you had
        callback.pending();
    });

    this.When(/^click sign up$/, function (callback) {
        // express the regexp above with the code you wish you had
        callback.pending();
    });

    this.Then(/^I should be signed up$/, function (callback) {
        // express the regexp above with the code you wish you had
        callback.pending();
    });

    this.Then(/^I should see the sign\-up welcome message$/, function (callback) {
        // express the regexp above with the code you wish you had
        callback.pending();
    });

    this.Then(/^I should see the sign up and login menu item$/, function (callback) {
        // express the regexp above with the code you wish you had
        this.proxy.page.waitForSelector(".navbar-static-top .nav.pull-right .dropdown:visible", callback, 1000);
    });

    this.When(/^I click the sign up and login menu item$/, function (callback) {
        // express the regexp above with the code you wish you had
        callback.pending();
    });

    this.Then(/^I should see the sign up and login form$/, function (callback) {
        // express the regexp above with the code you wish you had
        callback.pending();
    });

    this.When(/^I type my username in the sign up form$/, function (callback) {
        // express the regexp above with the code you wish you had
        callback.pending();
    });

    this.Then(/^I should see a spinner in the sign up form$/, function (callback) {
        // express the regexp above with the code you wish you had
        callback.pending();
    });

    this.When(/^the spinner in the sign up form is gone$/, function (callback) {
        // express the regexp above with the code you wish you had
        callback.pending();
    });

    this.Then(/^I should see the full sign up form$/, function (callback) {
        // express the regexp above with the code you wish you had
        callback.pending();
    });

    this.When(/^I fill in the rest of my details to sign up$/, function (callback) {
        // express the regexp above with the code you wish you had
        callback.pending();
    });


};

module.exports = signup_and_auth;