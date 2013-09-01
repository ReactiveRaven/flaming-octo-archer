module.exports = function () {
    'use strict';

    this.When(/^I click to upload an image$/, function (callback) {
        if (this.browser.findElement(this.By.id('galleryButtonUpload')).isDisplayed()) {
            this.browser.findElement(this.By.id('galleryButtonUpload')).click();
            callback();
        } else {
            callback.fail("Couldn't see the galleryButtonUpload when trying to click it in 'I click to upload an image'");
        }
    });
    
    this.When(/^I fill in the upload image form$/, function (callback) {
        
        var self = this;
        
        self.browser.findElement(this.By.id('formUploadName')).sendKeys("Test Upload");
        self.browser.findElement(this.By.id('formUploadFile')).sendKeys("/test");
        
        callback();
    });
    
};