/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */

// ***********************************************
// This example commands.js shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************
//
//
// -- This is a parent command --
// Cypress.Commands.add("login", (email, password) => { ... })
//
//
// -- This is a child command --
// Cypress.Commands.add("drag", { prevSubject: 'element'}, (subject, options) => { ... })
//
//
// -- This is a dual command --
// Cypress.Commands.add("dismiss", { prevSubject: 'optional'}, (subject, options) => { ... })
//
//
// -- This will overwrite an existing command --
// Cypress.Commands.overwrite("visit", (originalFn, url, options) => { ... })

const DEFAULT_OPTS = {
  log: true,
  timeout: 30000,
};
const DEFAULT_IFRAME_SELECTOR = 'iframe';

function sleep(timeout) {
  return new Promise((resolve) => setTimeout(resolve, timeout));
}

function timeoutFn(cb, timeout) {
  return new Promise((resolve) => {
    let done = false;
    let finish = () => done || resolve();
    cb().then(finish);
    sleep(timeout).then(finish);
  });
}

function frameLoaded(selector, opts) {
  if (selector === undefined) {
    selector = DEFAULT_IFRAME_SELECTOR;
  } else if (typeof selector === 'object') {
    opts = selector;
    selector = DEFAULT_IFRAME_SELECTOR;
  }

  const fullOpts = {
    ...DEFAULT_OPTS,
    ...opts,
  };
  const log = fullOpts.log
    ? Cypress.log({
        name: 'frame loaded',
        displayName: 'frame loaded',
        message: [selector],
      }).snapshot()
    : null;
  return cy.get(selector, {log: false}).then({timeout: fullOpts.timeout}, async ($frame) => {
    if (log && log.set) log.set('$el', $frame);
    if ($frame.length !== 1) {
      throw new Error(
        `cypress-iframe commands can only be applied to exactly one iframe at a time.  Instead found ${$frame.length}`,
      );
    }

    const contentWindow = $frame.prop('contentWindow');
    const hasNavigated = fullOpts.url
      ? () =>
          typeof fullOpts.url === 'string'
            ? contentWindow.location.toString().includes(fullOpts.url)
            : fullOpts.url && fullOpts.url.test(contentWindow.location.toString())
      : () => contentWindow.location.toString() !== 'about:blank';

    while (!hasNavigated()) {
      await sleep(100);
    }

    if (contentWindow.document.readyState === 'complete') {
      return $frame;
    }

    const loadLog = Cypress.log({
      name: 'Frame Load',
      message: [contentWindow.location.toString()],
      event: true,
    }).snapshot();
    await new Promise((resolve) => {
      Cypress.$(contentWindow).on('load', resolve);
    });
    loadLog.end();
    if (log && log.finish) log.finish();
    return $frame;
  });
}
Cypress.Commands.add('frameLoaded', frameLoaded);

function iframe(selector, opts) {
  if (selector === undefined) {
    selector = DEFAULT_IFRAME_SELECTOR;
  } else if (typeof selector === 'object') {
    opts = selector;
    selector = DEFAULT_IFRAME_SELECTOR;
  }

  const fullOpts = {
    ...DEFAULT_OPTS,
    ...opts,
  };
  const log = fullOpts.log
    ? Cypress.log({
        name: 'iframe',
        displayName: 'iframe',
        message: [selector],
      }).snapshot()
    : null;
  return cy.frameLoaded(selector, {...fullOpts, log: false}).then(($frame) => {
    if (log && log.set) log.set('$el', $frame).end();
    const contentWindow = $frame.prop('contentWindow');
    return Cypress.$(contentWindow.document.body);
  });
}
Cypress.Commands.add('iframe', iframe);

function enter(selector, opts) {
  if (selector === undefined) {
    selector = DEFAULT_IFRAME_SELECTOR;
  } else if (typeof selector === 'object') {
    opts = selector;
    selector = DEFAULT_IFRAME_SELECTOR;
  }

  const fullOpts = {
    ...DEFAULT_OPTS,
    ...opts,
  };

  const log = fullOpts.log
    ? Cypress.log({
        name: 'enter',
        displayName: 'enter',
        message: [selector],
      }).snapshot()
    : null;

  return cy.iframe(selector, {...fullOpts, log: false}).then(($body) => {
    if (log && log.set) log.set('$el', $body).end();
    return () => cy.wrap($body, {log: false});
  });
}
Cypress.Commands.add('enter', enter);
