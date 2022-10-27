it('works!', () => {
	cy.visit('/');
	cy.injectAxe();
	cy.checkA11y();
	cy.saveAccessibility('test');
});
