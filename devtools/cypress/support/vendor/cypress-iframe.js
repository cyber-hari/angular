// Copyright 2020 Kevin Groat (kgroat)
// 
// Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
// 
// The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
// 
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

const DEFAULT_OPTS = {
  log: true,
  timeout: 30000,
};
const DEFAULT_IFRAME_SELECTOR = 'iframe';

function sleep(timeout) {
  return new Promise((resolve) => setTimeout(resolve, timeout));
}

export function frameLoaded(selector, opts) {
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

export function iframe(selector, opts) {
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

export function enter(selector, opts) {
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
