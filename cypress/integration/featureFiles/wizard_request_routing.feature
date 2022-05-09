Feature: Service Details Wizard: Request Routing

  User navigates to the service details page and open the Kiali Wizard to generate a Request Routing scenario.

  Background:
    Given user is at administrator perspective

  @wizard-request-routing
  Scenario: Create a Request Routing scenario
    When user opens the namespace "bookinfo" and "reviews" service details page
    And user clicks in the "Request Routing" actions
    And user sees the "Create Request Routing" wizard
    And user clicks in the "Request Matching" tab
    And user clicks in the "headers" request matching dropdown
    And user types "end-user" in the matching header input
    And user clicks in the "exact" match value dropdown
    And user types "jason" in the match value input
    And user adds a match
    And user clicks in the "Route To" tab
    And user types "100" traffic weight in the "reviews-v2" workload
    And user adds a route
    And user clicks in the "Request Matching" tab
    And user clicks in "headers [end-user] exact jason" matching selected
    And user clicks in the "Route To" tab
    And user types "100" traffic weight in the "reviews-v3" workload
    And user adds a route
    And user previews the configuration
    And user creates the configuration
    Then user sees the "Istio Config" table with 2 rows

  @wizard-request-routing
  Scenario: See a DestinationRule generated
    When user clicks in the "Istio Config" table "DR" badge "reviews" name row link
    Then user sees the "kind: DestinationRule" regex in the editor
    And user sees the "bookinfo" "reviews" "service" reference
    And user sees the "bookinfo" "reviews-v1" "workload" reference
    And user sees the "bookinfo" "reviews-v2" "workload" reference
    And user sees the "bookinfo" "reviews-v3" "workload" reference
    And user sees the "bookinfo" "reviews" "virtualservice" reference

  @wizard-request-routing
  Scenario: See a VirtualService generated
    When user clicks in the "bookinfo" "reviews" "virtualservice" reference
    Then user sees the "kind: VirtualService" regex in the editor
    And user sees the "bookinfo" "reviews" "service" reference
    And user sees the "bookinfo" "reviews" "destinationrule" reference
    And user sees the "end-user:[\n ]*exact: jason" regex in the editor

  ## @wizard-request-routing
  Scenario: Delete the Request Routing scenario
    When user opens the namespace "bookinfo" and "reviews" service details page
    And user clicks in the "Delete Traffic Routing" actions
    And user confirms delete the configuration
    Then user sees the "Istio Config" table with empty message

