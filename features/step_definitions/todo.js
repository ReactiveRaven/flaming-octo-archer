var todo_steps = function () {
    this.World = require("../support/world.js").World; // overwrite default World constructor

    this.Given(/^I have no offers$/, function(callback) {
      // express the regexp above with the code you wish you had
      callback.pending();
    });

    this.Then(/^I am prompted to create an offer$/, function(callback) {
      // express the regexp above with the code you wish you had
      callback.pending();
    });

    this.When(/^I start creating an offer$/, function(callback) {
      // express the regexp above with the code you wish you had
      callback.pending();
    });

    this.When(/^I visit the site$/, function(callback) {
      // express the regexp above with the code you wish you had
      this.visit("http://test.commissar.dev", callback);
    });

};

module.exports = todo_steps;