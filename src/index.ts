import * as axe from 'axe-core';

type PageReport = { name: string, url: string, details: Details}
type Details = { violations: Detail[], passes: Detail[],incomplete: Detail[], inapplicable: Detail[]}
type Detail = { id: string, impact: string | null | undefined, nodes: Node[] }
type Node = { html: string; any: any[] }


declare global {
    interface Window {
        axe: typeof axe;
    }
}

declare global {
    // eslint-disable-next-line @typescript-eslint/no-namespace
    namespace Cypress {
        interface Chainable {
            injectAxe: typeof injectAxe;
            configureAxe: typeof configureAxe;
            checkA11y: typeof checkA11y;
            saveAccessibility: typeof saveAccessibility;
        }
    }
}

export interface Options extends axe.RunOptions {
    includedImpacts?: string[];
}

export const injectAxe = () => {
    const fileName =
        typeof require?.resolve === 'function'
            ? require.resolve('axe-core/axe.min.js')
            : 'node_modules/axe-core/axe.min.js';
    cy.readFile<string>(fileName).then((source) =>
        cy.window({log: false}).then((window) => {
            window.eval(source);
        })
    );
};

export const configureAxe = (configurationOptions = {}) => {
    cy.window({log: false}).then((win) => {
        return win.axe.configure(configurationOptions);
    });
};

function isEmptyObjectorNull(value: any) {
    if (value == null) {
        return true;
    }
    return Object.entries(value).length === 0 && value.constructor === Object;
}

const checkA11y = (
    context?: axe.ElementContext,
    options?: Options,
    resultsCallback?: (results: axe.AxeResults) => void,
    skipFailures = false
) => {
    cy.window({log: false})
        .then((win) => {
            if (isEmptyObjectorNull(context)) {
                context = undefined;
            }
            if (isEmptyObjectorNull(options)) {
                options = undefined;
            }
            if (isEmptyObjectorNull(resultsCallback)) {
                resultsCallback = undefined;
            }
            const {includedImpacts, ...axeOptions} = options || {};
            return win.axe
                .run(context || win.document, axeOptions)
                .then((results: axe.AxeResults) => {
                    if (resultsCallback) {
                        resultsCallback(results);
                    }
                });
        })
};


function urlToGeneric(url: string) {
    url = url.split("?")[0]
    url = url.split("#")[0]
    url = url.replace('http://localhost:4200/', '')
    const regexExp = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-5][0-9a-f]{3}-[089ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    const urlParts = url.split("/")
    let finalString = ""

    urlParts.forEach((u) => {
        if (regexExp.test(u)) {
            u = "UUID"
        }
        finalString += u + "/";
    })

    return finalString;

}

function makeNodesList(nodes: any []): Node [] {
    const nodeList: Node [] = []
    nodes.forEach((v) => {
        nodeList.push(
            {
                html: v.html,
                any: v.any,
            }
        )
    });
    return nodeList
}

function makeRapport(results: axe.AxeResults): any {

    const details: {
        violations: Detail[],
        passes: Detail[],
        incomplete: Detail[]
        inapplicable: Detail[]
    } = {
        violations: [],
        passes: [],
        incomplete: [],
        inapplicable: []

    }

    results.violations.forEach((violation) => {
        details.violations.push({
            id: violation.id,
            impact: violation.impact,
            nodes: makeNodesList(violation.nodes)
        })
    })

    results.passes.forEach((violation) => {
        details.passes.push({
            id: violation.id,
            impact: violation.impact,
            nodes: makeNodesList(violation.nodes)
        })
    })

    results.incomplete.forEach((violation) => {
        details.incomplete.push({
            id: violation.id,
            impact: violation.impact,
            nodes: makeNodesList(violation.nodes)
        })
    })

    results.inapplicable.forEach((violation) => {
        details.inapplicable.push({
            id: violation.id,
            impact: violation.impact,
            nodes: makeNodesList(violation.nodes)
        })
    })


    return details
}


export const saveAccessibility = (name: string) => {
    const scanName = 'cypress/downloads/report/scan.json'

    const url = name;
    name = urlToGeneric(name)
    cy.readFile(scanName).then((report) => {
        // if (report.find((e): any => e.name === name)) {
        //     return
        // }
        report = report.report;
        if (!report) {
            report = []
        }
        report = report.filter((e: any) => e.name !== name)
        const pageReport: PageReport = {
            url,
            name,
            details: {
                violations: [],
                passes: [],
                incomplete: [],
                inapplicable: []
            }
        }

        cy.injectAxe();
        cy.checkA11y(undefined, {
            runOnly: {
                type: 'tag',
                values: ['wcag2a', 'wcag2aa']
            },
        }, (results) => {


            pageReport.details = makeRapport(results)
        }, true);

        report.push(pageReport)
        report.sort((a: { name: number; }, b: { name: number; }) => a.name - b.name);
        cy.writeFile(scanName,
            {
                id: 'Scan: ' + new Date().toISOString().slice(0, 10),
                date: new Date().toISOString(),
                report
            }
        )
    })
}

Cypress.Commands.add('injectAxe', injectAxe);

Cypress.Commands.add('configureAxe', configureAxe);

Cypress.Commands.add('checkA11y', checkA11y);

Cypress.Commands.add('saveAccessibility', saveAccessibility);

before(() => {
    cy.writeFile('cypress/downloads/report/scan.json',
        {
            id: 'Scan: ' + new Date().toISOString().slice(0, 10),
            date: new Date().toISOString(),
            report: []
        }
    )
})
