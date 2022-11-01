'use strict';
var __rest =
	(this && this.__rest) ||
	function (s, e) {
		var t = {};
		for (var p in s)
			if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
				t[p] = s[p];
		if (s != null && typeof Object.getOwnPropertySymbols === 'function')
			for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
				if (
					e.indexOf(p[i]) < 0 &&
					Object.prototype.propertyIsEnumerable.call(s, p[i])
				)
					t[p[i]] = s[p[i]];
			}
		return t;
	};
Object.defineProperty(exports, '__esModule', { value: true });
exports.saveAccessibility = exports.configureAxe = exports.injectAxe = void 0;
var axe_html_reporter_1 = require('axe-html-reporter');
exports.injectAxe = function () {
	var fileName =
		typeof (require === null || require === void 0
			? void 0
			: require.resolve) === 'function'
			? require.resolve('axe-core/axe.min.js')
			: '../../node_modules/axe-core/axe.min.js';
	cy.readFile(fileName).then(function (source) {
		return cy.window({ log: false }).then(function (window) {
			window.eval(source);
		});
	});
};
exports.configureAxe = function (configurationOptions) {
	if (configurationOptions === void 0) {
		configurationOptions = {};
	}
	cy.window({ log: false }).then(function (win) {
		return win.axe.configure(configurationOptions);
	});
};
function isEmptyObjectorNull(value) {
	if (value == null) {
		return true;
	}
	return Object.entries(value).length === 0 && value.constructor === Object;
}
var checkA11y = function (context, options, resultsCallback, skipFailures) {
	if (skipFailures === void 0) {
		skipFailures = false;
	}
	cy.window({ log: false }).then(function (win) {
		if (isEmptyObjectorNull(context)) {
			context = undefined;
		}
		if (isEmptyObjectorNull(options)) {
			options = undefined;
		}
		if (isEmptyObjectorNull(resultsCallback)) {
			resultsCallback = undefined;
		}
		var _a = options || {},
			includedImpacts = _a.includedImpacts,
			axeOptions = __rest(_a, ['includedImpacts']);
		return win.axe
			.run(context || win.document, axeOptions)
			.then(function (results) {
				if (resultsCallback) {
					resultsCallback(results);
				}
			});
	});
};
function urlToGeneric(url) {
	url = url.split('?')[0];
	url = url.split('#')[0];
	url = url.replace('http://localhost:4200/', '');
	var regexExp = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-5][0-9a-f]{3}-[089ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
	var urlParts = url.split('/');
	var finalString = '';
	urlParts.forEach(function (u) {
		if (regexExp.test(u)) {
			u = 'UUID';
		}
		finalString += u + '/';
	});
	return finalString;
}
function makeNodesList(nodes) {
	var nodeList = [];
	nodes.forEach(function (v) {
		nodeList.push({
			html: v.html,
			any: v.any,
		});
	});
	return nodeList;
}
function makeRapport(results) {
	var details = {
		violations: [],
		passes: [],
		incomplete: [],
		inapplicable: [],
	};
	results.violations.forEach(function (violation) {
		details.violations.push({
			id: violation.id,
			impact: violation.impact,
			nodes: makeNodesList(violation.nodes),
		});
	});
	results.passes.forEach(function (violation) {
		details.passes.push({
			id: violation.id,
			impact: violation.impact,
			nodes: makeNodesList(violation.nodes),
		});
	});
	results.incomplete.forEach(function (violation) {
		details.incomplete.push({
			id: violation.id,
			impact: violation.impact,
			nodes: makeNodesList(violation.nodes),
		});
	});
	results.inapplicable.forEach(function (violation) {
		details.inapplicable.push({
			id: violation.id,
			impact: violation.impact,
			nodes: makeNodesList(violation.nodes),
		});
	});
	var reportHTML = axe_html_reporter_1.createHtmlReport({
		results: results,
		options: {
			projectKey: 'I need only raw HTML',
		},
	});
	cy.writeFile('cypress/downloads/report/report.html', reportHTML);
	return details;
}
exports.saveAccessibility = function (name) {
	var scanName = 'cypress/downloads/report/scan.json';
	var url = name;
	name = urlToGeneric(name);
	// @ts-ignore
	if (Cypress.getTestRetries() >= 1) {
		cy.writeFile(scanName, {
			id: 'Scan: ' + new Date().toISOString().slice(0, 10),
			date: new Date().toISOString(),
			report: {
				violations: [],
				passes: [],
				incomplete: [],
				inapplicable: [],
			},
		});
	}
	cy.readFile(scanName).then(function (report) {
		// if (report.find((e): any => e.name === name)) {
		//     return
		// }
		report = report.report;
		if (!report) {
			report = [];
		}
		report = report.filter(function (e) {
			return e.name !== name;
		});
		var pageReport = {
			url: url,
			name: name,
			details: {
				violations: [],
				passes: [],
				incomplete: [],
				inapplicable: [],
			},
		};
		cy.injectAxe();
		cy.checkA11y(
			undefined,
			{
				runOnly: {
					type: 'tag',
					values: ['wcag2a', 'wcag2aa'],
				},
			},
			function (results) {
				pageReport.details = makeRapport(results);
			},
			true
		);
		report.push(pageReport);
		report.sort(function (a, b) {
			return a.name - b.name;
		});
		cy.writeFile(scanName, {
			id: 'Scan: ' + new Date().toISOString().slice(0, 10),
			date: new Date().toISOString(),
			report: report,
		});
	});
};
Cypress.Commands.add('injectAxe', exports.injectAxe);
Cypress.Commands.add('configureAxe', exports.configureAxe);
Cypress.Commands.add('checkA11y', checkA11y);
Cypress.Commands.add('saveAccessibility', exports.saveAccessibility);
before(function () {
	cy.writeFile('cypress/downloads/report/scan.json', {
		id: 'Scan: ' + new Date().toISOString().slice(0, 10),
		date: new Date().toISOString(),
		report: [],
	});
});
