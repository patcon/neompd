Feature: Navigation
  Scenario: Go to an article page
    Given I'm on the home page
    When I click on an article tile
    Then I should go to the article page
    When I click on the Myplanet logo
    Then I should go to the home page

  Scenario: Go to an employee page
    Given I'm on the home page
    When I click on an employee tile
    Then I should go to the employee page
    When I click on the Myplanet logo
    Then I should go to the home page
