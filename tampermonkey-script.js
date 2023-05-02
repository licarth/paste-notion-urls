// ==UserScript==
// @name         Well-formatted Notion URLs to your clipboard
// @namespace    https://gist.github.com/licarth
// @version      0.1.1
// @description  Adds a button to copy/paste a nicely formatted link to the current Notion page. Paste it in Slack, GitHub, or anywhere that supports text/helm Clipboard items. Paste as value for markdown version.
// @author       licarth
// @match        https://www.notion.so/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=notion.so
// @require      http://ajax.googleapis.com/ajax/libs/jquery/2.1.0/jquery.min.js
// @require      https://gist.github.com/raw/2625891/waitForKeyElements.js
// @updateURL    https://raw.githubusercontent.com/licarth/paste-notion-urls/main/tampermonkey-script.js
// @downloadURL  https://raw.githubusercontent.com/licarth/paste-notion-urls/main/tampermonkey-script.js
// ==/UserScript==

/* globals ClipboardItem waitForKeyElements $ */

"use strict";
const INITIAL_BUTTON_TEXT = "Copy Formatted URL";

function displayButton() {
  const linkDiv = document.createElement("div");
  linkDiv.innerHTML = INITIAL_BUTTON_TEXT;
  linkDiv.setAttribute("id", "copyUrlButton");
  linkDiv.setAttribute("role", "button");
  linkDiv.setAttribute(
    "style",
    "user-select: none; transition: background 20ms ease-in 0s; cursor: pointer; display: inline-flex; align-items: center; flex-shrink: 0; white-space: nowrap; height: 28px; border-radius: 3px; font-size: 14px; line-height: 1.2; min-width: 0px; padding-left: 8px; padding-right: 8px; color: rgba(255, 255, 255, 0.81); margin-right: 2px;"
  );
  document
    .getElementsByClassName("notion-topbar-share-menu")[0]
    .parentNode.appendChild(linkDiv);

  document
    .getElementById("copyUrlButton")
    .addEventListener("click", onButtonClick, false);

  function onButtonClick() {
    const topBar = linkDiv.parentNode.parentNode.parentNode;
    const pageTitles =
      topBar.childNodes[topBar.childNodes.length === 3 ? 0 : 1].childNodes;
    const lastPageTitleDiv = pageTitles[pageTitles.length - 1];
    const pageEmoji =
      lastPageTitleDiv.childNodes.length === 1
        ? null
        : lastPageTitleDiv.childNodes[0].textContent;
    const pageTitle = pageEmoji
      ? lastPageTitleDiv.childNodes[1].textContent
      : lastPageTitleDiv.textContent;
    const pageLogoAndTitle = (pageEmoji ? `${pageEmoji} ` : "") + pageTitle;

    navigator.clipboard.write([
      new ClipboardItem({
        "text/plain": new Blob(
          [`[${pageLogoAndTitle}](${window.location.href})`],
          {
            type: "text/plain",
          }
        ),
        "text/html": new Blob(
          [
            `<a target="_blank" class="c-link" href="${window.location.href}">${pageLogoAndTitle}</a>`,
          ],
          {
            type: "text/html",
          }
        ),
      }),
    ]);

    linkDiv.textContent = "✅ Copied!";
    setTimeout(() => {
      linkDiv.textContent = INITIAL_BUTTON_TEXT;
    }, 1500);

    console.log(`Copied '${pageLogoAndTitle}' to clipboard !`);
  }
}

(function () {
  waitForKeyElements(".notion-topbar-share-menu", displayButton, true);
})();
