Feature: Profile
   As an artist
   In order to differentiate myself
   I want to set up a profile

   Scenario: View my profile
      When I visit the site
      Given I am logged in as "USER" with password "swordfish"
      Then I should see "My Profile" in the user dropdown
      When I click "My Profile" in the user dropdown
      Then I should see "USER" in the "h1" element