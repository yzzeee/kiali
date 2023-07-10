import { When, And, Then } from '@badeball/cypress-cucumber-preprocessor';
import { getCellsForCol } from './table';

const tracingDotQuery = '[style*="fill: var(--pf-global--palette--blue-200)"][style*="stroke: transparent;"]';

function openTab(tab: string) {
  cy.get('#basic-tabs').should('be.visible').contains(tab).click();
}

function openEnvoyTab(tab: string) {
  cy.get('#envoy-details').should('be.visible').contains(tab).click();
}

Then('user sees details information for workload', () => {
  cy.getBySel('workload-description-card').within(() => {
    cy.get('#pfbadge-A').parent().parent().contains('details'); // App
    cy.get('#pfbadge-W').parent().parent().contains('details-v1'); // Workload
    cy.get('#pfbadge-S').parent().parent().contains('details'); // Service
  });
});

Then('user sees workload inbound and outbound traffic information', () => {
  openTab('Traffic');
  cy.contains('Inbound Traffic');
  cy.contains('No Inbound Traffic').should('not.exist');
  cy.contains('No Outbound Traffic');
});

Then('user sees workload inbound metrics information', () => {
  cy.intercept(Cypress.config('baseUrl') + `/api/namespaces/bookinfo/workloads/details-v1/dashboard*`).as(
    'fetchMetrics'
  );
  openTab('Inbound Metrics');
  cy.wait('@fetchMetrics');
  cy.waitForReact(1000, '#root');
  cy.getReact('IstioMetricsComponent', { props: { 'data-test': 'inbound-metrics-component' } })
    // HOCs can match the component name. This filters the HOCs for just the bare component.
    .then(
      (metricsComponents: any) => metricsComponents.filter(component => component.name === 'IstioMetricsComponent')[0]
    )
    .getCurrentState()
    .then(state => {
      cy.wrap(state.dashboard).should('not.be.empty');
    });
});

Then('user sees workload outbound metrics information', () => {
  cy.intercept(Cypress.config('baseUrl') + `/api/namespaces/bookinfo/workloads/details-v1/dashboard*`).as(
    'fetchMetrics'
  );
  openTab('Outbound Metrics');
  cy.wait('@fetchMetrics');
  cy.waitForReact(1000, '#root');
  cy.getReact('IstioMetricsComponent', { props: { 'data-test': 'outbound-metrics-component' } })
    // HOCs can match the component name. This filters the HOCs for just the bare component.
    .then(
      (metricsComponents: any) => metricsComponents.filter(component => component.name === 'IstioMetricsComponent')[0]
    )
    .getCurrentState()
    .then(state => {
      cy.wrap(state.dashboard).should('not.be.empty');
    });
});

And('user can filter spans by workload', () => {
  cy.get('select[aria-label="filter_select_type"]').select('Workload');
  cy.get('input[placeholder="Filter by Workload"]').type('details-v1{enter}');
  getCellsForCol('App / Workload').each($cell => {
    cy.wrap($cell).contains('details-v1');
  });
  // TODO: Assert that something has opened after clicking. There is currently
  // a bug where the kebab doesn't do anything when clicked.
  getCellsForCol(4).first().click();
});

When(
  'the user filters by {string} with value {string} on the {string} tab',
  (filter: string, value: string, tab: string) => {
    openTab('Envoy');
    openEnvoyTab(tab);
    cy.waitForReact(1000, '#root');
    cy.get('select[aria-label="filter_select_type"]').select(filter);
    cy.get('input[aria-label="filter_input_value"]').type(`${value}{enter}`);
  }
);

Then('the user sees clusters expected information', () => {
  cy.get('tbody').within(() => {
    cy.contains('td', 'BlackHoleCluster').should('not.exist');
    cy.contains('td', 'details.bookinfo.svc.cluster.local');
  });
});

Then('the user sees listeners expected information', () => {
  cy.get('tbody').within(() => {
    cy.contains('td', 'PassthroughCluster').should('not.exist');
    cy.contains('td', 'Route: 9090');
  });
});

Then('the user sees routes expected information', () => {
  cy.get('tbody').within(() => {
    cy.contains('td', '15010').should('not.exist');
    cy.contains('td', '9080');
  });
});

When('the user looks for the bootstrap tab', () => {
  openTab('Envoy');
  openEnvoyTab('Bootstrap');
});

Then('the user sees bootstrap expected information', () => {
  cy.get('[id="ace-editor"]').contains('bootstrap');
});

When('the user looks for the config tab', () => {
  openTab('Envoy');
  openEnvoyTab('Config');
});

Then('the user sees config expected information', () => {
  cy.get('[id="ace-editor"]').contains('config_dump');
});

Then('the user sees the metrics tab', () => {
  cy.intercept(Cypress.config('baseUrl') + `/api/namespaces/bookinfo/customdashboard/envoy*`).as('fetchEnvoyMetrics');
  openTab('Envoy');
  openEnvoyTab('Metrics');
  cy.wait('@fetchEnvoyMetrics');
  cy.waitForReact(1000, '#root');
  cy.contains('Loading metrics').should('not.exist');
  cy.getReact('CustomMetricsComponent', { props: { 'data-test': 'envoy-metrics-component' } })
    .then(
      (metricsComponents: any) => metricsComponents.filter(component => component.name === 'CustomMetricsComponent')[0]
    )
    .getCurrentState()
    .then(state => {
      cy.wrap(state.dashboard).should('not.be.empty');
    });
});
