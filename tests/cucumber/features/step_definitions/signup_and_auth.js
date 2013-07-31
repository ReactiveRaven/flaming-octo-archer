// features/step_definitions/artist_experience.js

var signup_and_auth = function () {
  this.World = require("../support/world.js").World; // overwrite default World constructor
  
  this.Given(/^I am (not logged in|not signed in|signed out|logged out)$/, function(match, callback) {
      this.open(this.settings.url + "/logout", callback);
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
  
  
  
  this.Then(/^I should see the artist sign up form$/, function(callback) {
    // express the regexp above with the code you wish you had
    callback.pending();
  });

  this.Given(/^I am not registered$/, function(callback) {
    // express the regexp above with the code you wish you had
    callback.pending();
  });

  this.When(/^I fill in the artist sign up form$/, function(callback) {
    // express the regexp above with the code you wish you had
    callback.pending();
  });

  this.When(/^click sign up$/, function(callback) {
    // express the regexp above with the code you wish you had
    callback.pending();
  });

  this.Then(/^I should be signed up$/, function(callback) {
    // express the regexp above with the code you wish you had
    callback.pending();
  });

  this.Then(/^I should see the sign\-up welcome message$/, function(callback) {
    // express the regexp above with the code you wish you had
    callback.pending();
  });
  

};

module.exports = signup_and_auth;