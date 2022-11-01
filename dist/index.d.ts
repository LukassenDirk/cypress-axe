import * as axe from 'axe-core';
declare global {
    interface Window {
        axe: typeof axe;
    }
}
declare global {
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
export declare const injectAxe: () => void;
export declare const configureAxe: (configurationOptions?: {}) => void;
declare const checkA11y: (context?: string | globalThis.Node | NodeList | axe.ContextObject | undefined, options?: Options | undefined, resultsCallback?: ((results: axe.AxeResults) => void) | undefined) => void;
export declare const saveAccessibility: (name: string) => void;
export {};
