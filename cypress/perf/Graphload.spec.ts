import overviewCases from '../fixtures/perf/overviewPage.json';

function createNamespaces(count: number) {
  cy.log(`Creating ${count} namespaces...`);
  for (let i = 1; i <= count; i++) {
    const namespaceTemplate = `apiVersion: v1
kind: Namespace
metadata:
  name: perf-testing-${i}
  labels:
    kiali.io: perf-testing
`;
    cy.exec(`printf "${namespaceTemplate}" | kubectl apply -f -`);
  }
}

function deleteNamespaces() {
  cy.log('Deleting namespaces...');
  // This can take awhile to delete. Waiting for 10 mins max.
  cy.exec('kubectl delete --ignore-not-found=true -l kiali.io=perf-testing ns', {timeout: 600000});
}

type OverviewCase = {
  namespaces: number;
};

describe('Performance tests', () => {
  const reportFilePath = 'logs/performance.txt';

  before(() => {
    // Setup the perf report.
    cy.writeFile(reportFilePath, 'PERFORMANCE REPORT\n\n');

    cy.login(Cypress.env('USERNAME'), Cypress.env('PASSWD'));
  });

  beforeEach(() => {
    Cypress.Cookies.preserveOnce('kiali-token-aes');
  });

  // Testing empty namespaces to understand the impact of adding namespaces alone.
  describe('Overview page with empty namespaces', () => {
    before(() => {
      cy.writeFile(reportFilePath, '[Empty Namespaces]\n\n', { flag: 'a+' });
    });

    (overviewCases as OverviewCase[]).forEach(function (testCase) {
      describe(`Test with ${testCase.namespaces} empty namespaces`, () => {
        before(() => {
          createNamespaces(testCase.namespaces);
        });

        after(() => {
          deleteNamespaces();
        });

        it('loads the overview page', () => {
          // Getting an average to smooth out the results.
          let sum = 0;
          const visits = Array.from({ length: 5 });
          cy.wrap(visits)
            .each(() => {
              // Disabling refresh so that we can see how long it takes to load the page without additional requests
              // being made due to the refresh.
              cy.visit('/console/overview?refresh=0', {
                onBeforeLoad(win) {
                  win.performance.mark('start');
                }
              })
                .its('performance')
                .then(performance => {
                  cy.get('.pf-l-grid').should('be.visible');
                  cy.get('#loading_kiali_spinner', { timeout: 300000 })
                    .should('not.exist')
                    .then(() => {
                      performance.mark('end');
                      performance.measure('initPageLoad', 'start', 'end');
                      const measure = performance.getEntriesByName('initPageLoad')[0];
                      const duration = measure.duration;
                      sum += duration;
                    });
                });
            })
            .then(() => {
              sum = sum / visits.length;
              const contents = `Namespaces: ${testCase.namespaces}
  Init page load time: ${(sum / 1000).toPrecision(5)} seconds

`;
              cy.writeFile(reportFilePath, contents, { flag: 'a+' });
            });
        });
      });
    });
  });

  describe('Graph page with workloads', () => {
    var graphUrl;

    before(() => {
      cy.fixture('graphParams')
        .then(function (data) {
          graphUrl = encodeURI(
            '/console/graph/namespaces?traffic=' +
              data.traffic +
              '&graphType=' +
              data.graphType +
              '&namespaces=' +
              data.namespaces +
              '&duration=' +
              data.duration +
              '&refresh=' +
              data.refresh +
              '&layout=' +
              data.layout +
              '&namespaceLayout=' +
              data.namespaceLayout
          );
        })
        .as('data');

      cy.writeFile(reportFilePath, '[Graph page With workloads]\n\n', { flag: 'a+' });
    });

    it('Measures Graph load time', { defaultCommandTimeout: Cypress.env('timeout') }, () => {
      cy.intercept(`**/api/namespaces/graph*`).as('graphNamespaces');
      cy.visit(graphUrl, {
        onBeforeLoad(win) {
          win.performance.mark('start');
        }
      })
        .its('performance')
        .then(performance => {
          cy.wait('@graphNamespaces');

          cy.get('#cy', { timeout: 10000 })
            .should('be.visible')
            .then(() => {
              performance.mark('end');
              performance.measure('pageLoad', 'start', 'end');
              const measure = performance.getEntriesByName('pageLoad')[0];
              const duration = measure.duration;
              assert.isAtMost(duration, Cypress.env('threshold'));

              const contents = `Graph load time for ${graphUrl}: ${(duration / 1000).toPrecision(5)} seconds

  `;
              cy.writeFile(reportFilePath, contents, { flag: 'a+' });
            });
        });
    });
  });
});
