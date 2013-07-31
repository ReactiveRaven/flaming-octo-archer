Feature: Sign up
   In order to start selling
   As a artist
   I want to sign up to the site

   Scenario: Form visible
      Given I am not logged in
      When I visit the site
      Then I should see the sign up and login menu item
      When I click the sign up and login menu item
      Then I should see the sign up and login form

   Scenario: Signing up works
      Given I am not logged in
      And I am not registered
      When I click the sign up and login menu item
      And I type my username in the sign up form
      Then I should see a spinner in the sign up form
      When the spinner in the sign up form is gone
      Then I should see the full sign up form
      When I fill in the rest of my details to sign up
      And click sign up
      Then I should be signed up
      And I should see the sign-up welcome message