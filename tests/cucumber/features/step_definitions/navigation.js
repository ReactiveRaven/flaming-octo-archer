module.exports = function () {
    "use strict";
    
    this.When(/^I visit the site$/, function (callback) {
        // express the regexp above with the code you wish you had
        this.browser.get('http://localhost:9001/index_e2e.html').then(function () {
            callback();
        });
    });
    
    this.When(/^I wait for (\d+) seconds?$/, function (number, callback) {
        setTimeout(function () {
            callback();
        }, number * 1000);
    });
    
};