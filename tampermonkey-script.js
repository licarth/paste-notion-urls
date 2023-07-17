// ==UserScript==
// @name         Well-formatted Notion URLs to your clipboard
// @namespace    https://gist.github.com/licarth
// @version      0.4.1
// @description  Adds a button to copy/paste a nicely formatted link to the current Notion page. Paste it in Slack, GitHub, or anywhere that supports text/helm Clipboard items. Paste as value for markdown version.
// @author       licarth
// @match        https://www.notion.so/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=notion.so
// @require      http://ajax.googleapis.com/ajax/libs/jquery/2.1.0/jquery.min.js
// @require      https://gist.github.com/raw/2625891/waitForKeyElements.js
// @grant GM_addStyle
// @updateURL    https://raw.githubusercontent.com/licarth/paste-notion-urls/main/tampermonkey-script.js
// @downloadURL  https://raw.githubusercontent.com/licarth/paste-notion-urls/main/tampermonkey-script.js
// ==/UserScript==

/* globals ClipboardItem waitForKeyElements $ */

"use strict";
const INITIAL_BUTTON_TEXT = "link";

const IS_DARK_MODE = document.body.classList.contains("dark");

const textColor = IS_DARK_MODE
  ? "rgba(255, 255, 255, 0.81)"
  : "rgb(55, 53, 47)";
const backgroundColorOnHover = IS_DARK_MODE
  ? "rgba(255, 255, 255, 0.055)"
  : "rgba(55, 53, 47, 0.08)";

function getPeekPreviewParent(element) {
  return element.closest(".notion-peek-renderer");
}

function isWithinPeekPreview(element) {
  return Boolean(getPeekPreviewParent(element));
}

function createMarkdownIconSVG() {
  const iconSvg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  const iconPath = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "path"
  );

  iconSvg.setAttribute("viewBox", "0 0 16 16");
  iconSvg.classList.add("link");
  iconSvg.setAttribute(
    "style",
    `width: 20px; height: 20px; display: block; flex-shrink: 0; backface-visibility: hidden; margin-left: 0px; color: ${textColor};`
  );

  iconPath.setAttribute(
    "d",
    "M6.345 5h2.1v6.533H6.993l.055-5.31-1.774 5.31H4.072l-1.805-5.31c.04.644.06 5.31.06 5.31H1V5h2.156s1.528 4.493 1.577 4.807L6.345 5zm6.71 3.617v-3.5H11.11v3.5H9.166l2.917 2.916L15 8.617h-1.945z"
  );

  iconSvg.appendChild(iconPath);

  return iconSvg;
}

function displayButton(elements) {
  const el = elements[0];
  const peekPreview = isWithinPeekPreview(el);

  const textDiv = document.createElement("div");
  textDiv.innerHTML = INITIAL_BUTTON_TEXT;
  textDiv.setAttribute("role", "button");
  textDiv.setAttribute(
    "style",
    `
user-select: none;
transition: background 20ms ease-in 0s;
cursor: pointer;
display: inline-flex;
align-items: center;
flex-shrink: 0;
white-space: nowrap;
height: 28px;
border-radius: 3px;
font-size: 14px;
line-height: 1.2;
min-width: 0px;
padding-left: 8px;
margin-right: 2px;
`
  );

  const linkDiv = document.createElement("div");
  linkDiv.append(createMarkdownIconSVG());
  linkDiv.append(textDiv);
  linkDiv.setAttribute(
    "id",
    peekPreview ? "copyUrlButtonPeek" : "copyUrlButtonMain"
  );
  linkDiv.setAttribute("role", "button");
  linkDiv.setAttribute(
    "style",
    `
user-select: none;
transition: background 20ms ease-in 0s;
cursor: pointer;
display: inline-flex;
align-items: center;
flex-shrink: 0;
white-space: nowrap;
height: 28px;
border-radius: 4px;
font-size: 14px;
line-height: 1.2;
min-width: 0px;
padding-left: 8px;
padding-right: 4px;
margin-right: 6px;
margin-left: auto;
color: ${textColor};
display: inline-flex;
align-items: center;
`
  );

  GM_addStyle(`
    #copyUrlButtonMain:hover,#copyUrlButtonPeek:hover {
        background-color: ${backgroundColorOnHover} !important;
    }
`);

  el.parentNode.insertBefore(linkDiv, el.parentNode.firstChild);

  if (peekPreview) {
    document
      .getElementById("copyUrlButtonPeek")
      .addEventListener("click", () => onButtonClickPeek(el), false);
  } else {
    document
      .getElementById("copyUrlButtonMain")
      .addEventListener("click", () => onButtonClickMain(el), false);
  }

  function onButtonClickMain(element) {
    const topBar = element.parentNode.parentNode.parentNode.parentNode;
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

    copyLinkToPage(pageEmoji, pageTitle, window.location.href, textDiv);
  }

  function onButtonClickPeek(element) {
    const peekPreviewParent = getPeekPreviewParent(element);
    const emoji = peekPreviewParent.querySelector(
      ".notion-record-icon.notranslate"
    )?.textContent;
    const title = peekPreviewParent.querySelector(
      "div.notion-page-block > div.notranslate"
    )?.textContent;
    const openAsPageThickLogoElement = peekPreviewParent.querySelector(
      "svg.openAsPageThick"
    );
    const href = openAsPageThickLogoElement.closest("a")?.href;

    copyLinkToPage(emoji, title, href, textDiv);
  }
}

function copyToClipboard(pageLogoAndTitle, href) {
  navigator.clipboard.write([
    new ClipboardItem({
      "text/plain": new Blob([`[${pageLogoAndTitle}](${href})`], {
        type: "text/plain",
      }),
      "text/html": new Blob(
        [
          `<a target="_blank" class="c-link" href="${href}">${pageLogoAndTitle}</a>`,
        ],
        {
          type: "text/html",
        }
      ),
    }),
  ]);
}

function copyLinkToPage(emoji, title, href, textDiv) {
  const pageLogoAndTitle = (emoji ? `${emoji} ` : "") + title;

  copyToClipboard(pageLogoAndTitle, href);

  textDiv.textContent = "✅ Copied!";
  setTimeout(() => {
    textDiv.textContent = INITIAL_BUTTON_TEXT;
  }, 1500);

  console.log(`Copied '${pageLogoAndTitle}' to clipboard !`);
}

(function () {
  waitForKeyElements(".notion-topbar-share-menu", displayButton, false);
})();
