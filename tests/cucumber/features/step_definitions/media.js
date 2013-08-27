module.exports = function () {
    'use strict';
    
    var galleryButtonUpload;

    this.When(/^I click to upload an image$/, function (callback) {
        if (this.browser.findElement(this.By.id('galleryButtonUpload')).isDisplayed()) {
            this.browser.findElement(this.By.id('galleryButtonUpload')).click();
            callback();
        } else {
            callback.fail("Couldn't see the galleryButtonUpload when trying to click it in 'I click to upload an image'");
        }
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