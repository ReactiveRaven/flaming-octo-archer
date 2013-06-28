Feature: Sign up
   In order to start selling
   As a artist
   I want to sign up to the site

   Scenario: Form visible
      Given I am not logged in
      When I visit the site
      Then I should see the artist sign up form

   Scenario: Signing up works
      Given I am not logged in
      And I am not registered
      When I fill in the artist sign up form
      And click sign up
      Then I should be signed up
      And I should see the sign-up welcome message