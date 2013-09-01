module.exports = function () {
    "use strict";
    
    var indexhtml = 'http://localhost:9001/index_cucumber.html';
    
    this.When(/^I visit the site$/, function (callback) {
        // express the regexp above with the code you wish you had
        this.browser.get(indexhtml).then(function () {
            callback();
        });
    });
    
    this.When(/^I wait for (\d+) seconds?$/, function (number, callback) {
        setTimeout(function () {
            callback();
        }, number * 1000);
    });
    
    this.When(/^I visit my gallery$/, function (callback) {
        var self = this;
        self.browser.findElement(self.By.id('menuMyAccountDropdown')).isDisplayed().then(function (isDisplayed) {
            if (!isDisplayed) {
                self.browser.findElement(self.By.id('menuMyAccountToggle')).click();
            }
            self.browser.findElement(self.By.id('menuMyAccountItemGallery')).click();
            callback();
        });
    });
    
    this.When(/^I land on someone's gallery$/, function (callback) {
        var self = this;
        self.browser.get(indexhtml + "#!/someone/gallery").then(function () {
            callback();
        });
    });
    
    
};