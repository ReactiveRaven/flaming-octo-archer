module.exports = function () {
    'use strict';

    this.When(/^I click to upload an image$/, function (callback) {
        callback.fail("TODO! I click to upload an image");
        var self = this;
        
        self.ok = true;
    });
    
    this.When(/^I fill in the upload image form$/, function (callback) {
        // express the regexp above with the code you wish you had
        callback.fail("TODO! I fill in the upload image form");
    });

    this.When(/^I submit the upload image form$/, function (callback) {
        // express the regexp above with the code you wish you had
        callback.fail("TODO! I submit the upload image form");
    });

    this.Then(/^I should see the new image in my gallery$/, function (callback) {
        // express the regexp above with the code you wish you had
        callback.fail("TODO! I should see the new image in my gallery");
    });
    
};