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

Feature: Create a offer
   As a artist
   In order to sell commissions
   I want to create a commission offer.

   Scenario: No offers yet
      Given I am signed in as an artist
      And I have no offers
      Then I am prompted to create an offer

   Scenario: Creating first offer
      Given I am signed in as an artist
      And I have no offers
      When I start creating an offer
      Then I should be shown the tutorial
