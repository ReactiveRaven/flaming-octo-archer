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