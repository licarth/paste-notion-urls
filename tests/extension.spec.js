/**
 * E2E tests for the "Copy Formatted URL" Tampermonkey extension.
 *
 * Injects the user script into a real Notion page and verifies:
 *  - The button appears in the topbar
 *  - Clicking the button copies a formatted link to the clipboard
 *
 * Prerequisites:
 *   npm run save-auth    (one-time — saves Notion login session)
 *   npm test             (runs these tests)
 */
import { test, expect } from "@playwright/test";
import { injectExtension, waitForNotion } from "./helpers.js";

test.describe("Copy Formatted URL extension", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await waitForNotion(page);
  });

  test("injects the copy button into the topbar", async ({ page }) => {
    await injectExtension(page);

    const button = page.locator("#copyUrlButtonMain");
    await expect(button).toBeVisible({ timeout: 10_000 });
  });

  test("button copies formatted link to clipboard", async ({
    page,
    context,
  }) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);

    await injectExtension(page);

    const button = page.locator("#copyUrlButtonMain");
    await expect(button).toBeVisible({ timeout: 10_000 });

    await button.click();

    // Verify "Copied!" feedback appears
    await expect(page.locator("text=Copied!")).toBeVisible({ timeout: 5000 });

    // Read clipboard content
    const clipboardText = await page.evaluate(() =>
      navigator.clipboard.readText()
    );

    // Should be a markdown-formatted link: [title](url)
    expect(clipboardText).toMatch(/\[.+\]\(https:\/\/www\.notion\..+\)/);
  });
});
