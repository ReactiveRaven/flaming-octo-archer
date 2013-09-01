Feature: Gallery
    As a artist
    I want to add images to my gallery

    Scenario: Uploading an image
        When I visit the site
        Given I am logged in
        When I visit my gallery
        Then I should see an option to upload an image
        When I click to upload an image
        Then I should see the image upload form
        When I fill in the upload image form
        Then I should see the submit upload button
        #When I submit the upload image form
        #Then I should see the new image in my gallery

    Scenario: Viewing a gallery
        When I visit the site
        And I land on someone's gallery
        Then I should see the public images
        And I should not see the private images

      