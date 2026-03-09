# `paste-notion-urls`

Copy & paste Notion urls in Slack, GitHub, or any tool supporting markdown urls.

<img width="860" alt="Tool Screenshot" src="https://user-images.githubusercontent.com/5550241/236143571-e2158c93-cde1-4024-aced-dd6f85831952.png">

Generates links like [✅ My todo](https://www.notion.so/licarth/My-todo-a80d4d568d894094af7094216cdd4258) in GitHub issues.

## Install

1. Install [Tampermonkey](https://www.tampermonkey.net/) (browser extension for Chrome, Safari, Edge, Firefox, Opera).
1. Go to the extension's `Dashboard` > `Utilities` > `Import from URL`.
Paste this link `https://raw.githubusercontent.com/licarth/paste-notion-urls/main/tampermonkey-script.js` and click Install.
1. Go (or refresh) to a Notion page, click on top-right "Copy Formatted URL" on the top right.
1. You can paste your link in Slack with `cmd/ctrl + V`
1. You can paste your links in Markdown format (for GitHub issues) with `maj + cmd/ctrl + V`

> **Note:** The script works on both `notion.so` and `notion.com`.

## Development

### Prerequisites

- Node.js >= 18
- A Notion account (for E2E tests)

### Setup

```bash
npm install
npx playwright install chromium
```

### E2E Tests

The tests use [Playwright](https://playwright.dev/) to inject the Tampermonkey script into a real Notion page running in Chromium and verify it works end-to-end.

#### 1. Save your Notion session (one-time)

```bash
npm run save-auth
```

A browser window opens. Log into Notion — the script auto-detects when you're authenticated and saves the session to `auth/notion.state.json` (git-ignored).

You only need to re-run this when your session expires.

#### 2. Run the tests

```bash
npm test
```

This runs two tests:
- **Button injection** — verifies the "Copy Formatted URL" button appears in the Notion topbar.
- **Clipboard copy** — clicks the button and asserts the clipboard contains a well-formed markdown link (`[title](url)`).

#### 3. Diagnose Notion DOM changes

If Notion changes their site again and the extension breaks:

```bash
npm run test:diagnose
```

This dumps the current Notion DOM structure to `test-results/dom-diagnostics.json`, including:
- Which `notion-*` CSS classes exist
- The topbar element tree
- All share-related buttons and their attributes

Use this output to update the selectors in `tampermonkey-script.js`.

### Project structure

```
tampermonkey-script.js      # The Tampermonkey userscript
playwright.config.js        # Playwright config (Chromium, CSP bypass, auth)
scripts/
  save-auth.js              # Interactive auth-state saver
tests/
  helpers.js                # Script injection shims (GM_addStyle, waitForKeyElements)
  extension.spec.js         # E2E tests
  diagnose-dom.spec.js      # DOM diagnostic tool
```

## Contribute

Contributions are welcome. Issues are in [this GitHub project](https://github.com/licarth/paste-notion-urls/issues).
