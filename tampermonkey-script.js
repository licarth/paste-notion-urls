// ==UserScript==
// @name         Well-formatted Notion URLs to your clipboard
// @namespace    https://gist.github.com/licarth
// @version      0.4.0
// @description  Adds a button to copy/paste a nicely formatted link to the current Notion page. Paste it in Slack, GitHub, or anywhere that supports text/helm Clipboard items. Paste as value for markdown version.
// @author       licarth
// @match        https://www.notion.so/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=notion.so
// @require      http://ajax.googleapis.com/ajax/libs/jquery/2.1.0/jquery.min.js
// @require      https://gist.github.com/raw/2625891/waitForKeyElements.js
// @grant GM_addStyle
// @updateURL    https://raw.githubusercontent.com/licarth/paste-notion-urls/main/tampermonkey-script.js
// @grant        GM_registerMenuCommand
// @downloadURL  https://raw.githubusercontent.com/licarth/paste-notion-urls/main/tampermonkey-script.js
// ==/UserScript==

/* globals ClipboardItem waitForKeyElements $ */

"use strict";
const INITIAL_BUTTON_TEXT = "link";

const IS_DARK_MODE = document.body.classList.contains("dark");

const DEFAULT_SHORTCUT = {
  shortcutKey: {
    code: 'KeyL',
    key: 'l'
  },
  shortcutModifiers: {
    shift: { symbol: "⇧", key: "shiftKey", pressed: true },
    control: { symbol: "⌃", key: "ctrlKey", pressed: false },
    option: { symbol: "⌥", key: "altKey", pressed: true },
    command: { symbol: "⌘/⊞", key: "metaKey", pressed: true },
  }
}

const STORED_SHORTCUT = JSON.parse(localStorage.getItem('shortcut'));
const currentShortcut = STORED_SHORTCUT ? STORED_SHORTCUT : DEFAULT_SHORTCUT;

const textColor = IS_DARK_MODE
  ? "rgba(255, 255, 255, 0.81)"
  : "rgb(55, 53, 47)";

const backgroundColor = IS_DARK_MODE
  ? "rgba(31, 31, 31)"
  : "rgba(246, 245, 241)"

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
    addKeyboardShortcut(onButtonClickPeek);
    document
      .getElementById("copyUrlButtonPeek")
      .addEventListener("click", () => onButtonClickPeek(el), false);
  } else {
    addKeyboardShortcut(onButtonClickMain);
    document
      .getElementById("copyUrlButtonMain")
      .addEventListener("click", () => onButtonClickMain(el), false);
  }

  function isCurrentShortcutPressed(event) {
    return event.code === currentShortcut.shortcutKey.code
      && Object.entries(currentShortcut.shortcutModifiers)
        .every(([_, modifier]) => modifier.pressed === event[modifier.key])

  }

  function addKeyboardShortcut(callback) {
    document.addEventListener("keydown", (event) => {
      if (isCurrentShortcutPressed(event)) {
        callback(el)
      }
    });
  }

  function onButtonClickMain(element) {
    const topBar = element.parentNode.parentNode.parentNode;
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


/*
Setting Modal
*/

GM_addStyle(`
.backdrop {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 9998;
  backdrop-filter: blur(5px);
}

.modal {
  position: sticky;
  top: 0;
  width: 350px;
  margin: 0 auto;
  background-color: ${backgroundColor};
  border-radius:  0 0 8px 8px;
  z-index: 9999;
  padding: 50px 70px;
}



.modalButton {
  display: block;
  width: 100%;
  padding: 5px 0;
  margin: 15px 0;
  background-color: ${backgroundColor};
  color: ${textColor};
  border: solid 1px grey;
  border-radius: 4px;
  cursor: pointer;
}

.modalButton:hover {
  border-color: transparent;
  background-color: ${backgroundColorOnHover};
}

.settingContainer {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-evenly;
}

.settingLabel {
  color: #b4b4b4;
  padding-bottom: 25px;
  text-align: center;
  min-width: 50px;
  width: 100%;
}

.keyInput,
.modifierButton {
  font-size: 0.85em;
  text-align: center;
  font-weight: 700;
  line-height: 1;
  padding: 5px 0;
  margin: 0 6px 20px 0;
  background-color: #b4b4b4;
  height: 40px;
}

.modifierButton {
  font-weight: 900;
  min-width: 40px;
  border-radius: 3px;
  border: 1px solid #b4b4b4;
}

.keyInput {
  min-width: 50px;
  width: 100%;
  caret-color: #b4b4b4;
  text-transform: uppercase;
  border: none;
  border-radius: 5px;
  box-shadow: 0 0 5px rgba(0, 0, 0, 0.1);
}

.keyInput:blur,
.inactive {
  box-shadow: 0 1px 1px rgba(0, 0, 0, 0.2), 0 2px 0 0 rgba(255, 255, 255, 0.7) inset;
}

.keyInput:focus,
.active {
  box-shadow: 0 -3px 0 0 #ef4b4b inset, 0 0 3px #b4b4b4;
  border: 1px solid #b4b4b4;
}`);

function buildModalBackdrop() {
  const backdrop = document.createElement('div');
  backdrop.classList.add("backdrop");
  return backdrop;
}

function buildModal() {
  const modal = document.createElement('div');
  modal.classList.add("modal");
  return modal;
}

function isShortcutValid(shortcut) {
  return shortcut.shortcutKey.code && shortcut.shortcutKey.key
    && Object.entries(shortcut.shortcutModifiers).filter(([_, { pressed }]) => pressed).length > 0;
}

function buildModalButtons(tempShortcut, backdrop) {
  function createButton(textContent, callback) {
    const button = document.createElement('button');
    button.textContent = textContent;
    button.classList.add("modalButton");
    button.addEventListener('click', callback)
    return button;
  }

  const saveButton = createButton('save', () => {
    if (isShortcutValid(tempShortcut)) {
      localStorage.setItem('shortcut', JSON.stringify(tempShortcut));
      currentShortcut = tempShortcut;
      backdrop.remove()
    } else {
      alert('Invalid shortcut: set at least one modifier and a key');
    }
  });
  const cancelButton = createButton('cancel', () => backdrop.remove());
  return ({ saveButton, cancelButton });
}

function buildShortcutSetting(tempShortcut) {
  // Setting container
  const shortcutSettingContainer = document.createElement('div');
  shortcutSettingContainer.classList.add("settingContainer");

  // Setting label
  const shortcutSettingLabel = document.createElement('span');
  shortcutSettingLabel.innerHTML = 'Select modifiers and enter a key'
  shortcutSettingLabel.classList.add("settingLabel");
  shortcutSettingContainer.appendChild(shortcutSettingLabel);

  // Setting keys
  function buildModifierButton(modifier) {
    const key = document.createElement('button');
    key.classList.add("modifierButton");
    key.classList.add(modifier.pressed ? 'active' : 'inactive');
    key.addEventListener('click', () => {
      modifier.pressed = !modifier.pressed;
      key.classList.remove(modifier.pressed ? 'inactive' : 'active');
      key.classList.add(modifier.pressed ? 'active' : 'inactive');
    })
    key.innerHTML = modifier.symbol;
    shortcutSettingContainer.appendChild(key);
  }

  function buildKeyInput() {
    const input = document.createElement('input');
    input.setAttribute("placeholder", 'Key...');
    input.setAttribute("autocomplete", 'off');
    input.value = tempShortcut.shortcutKey.key;
    input.classList.add("keyInput");
    input.addEventListener('click', () => {
      tempShortcut.shortcutKey = {
        code: '',
        key: ''
      };
      input.value = '';
    })
    input.addEventListener('keydown', (event) => {
      tempShortcut.shortcutKey = {
        code: event.code,
        key: event.key
      };
    })
    input.addEventListener('keyup', () => { input.blur(); })
    shortcutSettingContainer.appendChild(input);
  }

  Object
    .entries(tempShortcut.shortcutModifiers)
    .forEach(([_, value]) => buildModifierButton(value));
  buildKeyInput();

  return shortcutSettingContainer;
};

function showSettingsModal() {
  const tempShortcut = {
    shortcutKey: currentShortcut.shortcutKey,
    shortcutModifiers: currentShortcut.shortcutModifiers
  }

  // Build the modal elements
  const backdrop = buildModalBackdrop();
  const modal = buildModal();
  const shortcutSetting = buildShortcutSetting(tempShortcut);
  const { saveButton, cancelButton } = buildModalButtons(tempShortcut, backdrop);

  // Assemble elements in DOM
  document.body.appendChild(backdrop);
  backdrop.appendChild(modal);

  modal.appendChild(shortcutSetting);
  modal.appendChild(saveButton);
  modal.appendChild(cancelButton);

  modal.focus();
}


// Add a menu command to open the setting
GM_registerMenuCommand("Set copy shortcut", showSettingsModal);
