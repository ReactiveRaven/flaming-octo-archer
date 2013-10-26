Feature: Sign up
   In order to start selling
   As a artist
   I want to sign up to the site

   Scenario: Signing up
      When I visit the site
      Given I am not logged in
      Then I should see "Sign up & Log in" in the ".navbar" element
      When I click "Sign up & Log in" in the ".navbar" element
      Then the "#menuLoginForm" element should be visible
      When I type an unregistered username in the sign up form
      Then the sign up button should be available
      When I type a password in the sign up form
      And I click to sign up
      Then I should see a welcome message
      And I should not see the sign up and login form 
      And I should see my account details in the menu

   Scenario: Logging in
      When I visit the site
      Given I am not logged in
      Then I should see the sign up and login menu item
      When I click the sign up and login menu item
      Then I should see the sign up and login form
      When I type a registered username in the sign up form
      Then the sign up button should not be available
      When I type a password in the sign up form
      And I click to log in
      And I should see my account details in the menu
