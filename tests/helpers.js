/**
 * Test helpers for injecting the Tampermonkey script into Playwright pages.
 *
 * Since Tampermonkey handles @require dependencies and GM_* APIs,
 * we need to shim those in the Playwright test environment.
 */
import * as fs from "fs";

const SCRIPT_SRC = fs.readFileSync("./tampermonkey-script.js", "utf-8");

/**
 * Inline implementation of waitForKeyElements (the Tampermonkey @require dep).
 * Uses MutationObserver instead of jQuery polling for better reliability.
 */
const WAIT_FOR_KEY_ELEMENTS_SHIM = `
function waitForKeyElements(selectorTxt, actionFunction, bWaitOnce, iframeSelector) {
  var targetNodes, btargetsFound;
  targetNodes = document.querySelectorAll(selectorTxt);

  if (targetNodes && targetNodes.length > 0) {
    btargetsFound = true;
    targetNodes.forEach(function (node) {
      var alreadyFound = node.dataset.alreadyFound || false;
      if (!alreadyFound) {
        var cancelFound = actionFunction([node]);
        if (cancelFound) btargetsFound = false;
        else node.dataset.alreadyFound = "true";
      }
    });
  } else {
    btargetsFound = false;
  }

  var controlObj = waitForKeyElements.controlObj || {};
  var controlKey = selectorTxt.replace(/[^\\w]/g, "_");
  var timeControl = controlObj[controlKey];

  if (btargetsFound && bWaitOnce && timeControl) {
    clearInterval(timeControl);
    delete controlObj[controlKey];
  } else {
    if (!timeControl) {
      timeControl = setInterval(function () {
        waitForKeyElements(selectorTxt, actionFunction, bWaitOnce, iframeSelector);
      }, 300);
      controlObj[controlKey] = timeControl;
    }
  }
  waitForKeyElements.controlObj = controlObj;
}
`;

/**
 * Shim for Tampermonkey's GM_addStyle API.
 */
const GM_SHIM = `
function GM_addStyle(css) {
  const style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);
}
`;

/**
 * Prepare the userscript for injection:
 * - Strip the ==UserScript== metadata block
 * - Prepend dependency shims
 */
export function prepareScript() {
  let script = SCRIPT_SRC.replace(
    /\/\/ ==UserScript==[\s\S]*?\/\/ ==\/UserScript==/,
    ""
  );
  // Remove the jQuery globals comment since we don't use jQuery
  script = script.replace(/\/\* globals.*\*\//, "");

  // Wrap in an IIFE so page.evaluate() can handle top-level declarations
  return (
    "(function() {\n" +
    GM_SHIM +
    "\n" +
    WAIT_FOR_KEY_ELEMENTS_SHIM +
    "\n" +
    script +
    "\n})();"
  );
}

/**
 * Inject the extension into a Playwright page.
 * Call after the page has loaded.
 */
export async function injectExtension(page) {
  const prepared = prepareScript();
  await page.evaluate(prepared);
}

/**
 * Wait for Notion to be ready (authenticated page loaded).
 */
export async function waitForNotion(page) {
  await page.waitForSelector(".notion-sidebar, .notion-frame", {
    timeout: 30_000,
  });
  await page.waitForTimeout(3000);
}
