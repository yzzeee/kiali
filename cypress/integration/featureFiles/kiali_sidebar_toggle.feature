Feature: Sidebar toggle 

User opens the Overview page and toggles the main sidebar.

  Background:
    Given user is at administrator perspective
    And user opens the overview page

  @sidebar-toggle
  Scenario: Close the sidebar
    When the sidebar is open
    And user presses the navigation toggle button
    Then user cannot see the sidebar

  @sidebar-toggle
  Scenario: Open the sidebar
    When the sidebar is closed
    And user presses the navigation toggle button
    Then user sees the sidebar
  