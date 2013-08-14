Feature: Sign up
   In order to start selling
   As a artist
   I want to sign up to the site

   Scenario: Form visible
      When I visit the site
      Given I am not logged in
      Then I should see the sign up and login menu item
      When I click the sign up and login menu item
      Then I should see the sign up and login form
      When I type an unregistered username in the sign up form
      Then the sign up button should be available
      When I click to sign up