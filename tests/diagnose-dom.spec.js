/**
 * Diagnostic test — dumps Notion's current DOM structure
 * so we can see which selectors work and which don't.
 *
 * Run with: npm run test:diagnose
 */
import { test, expect } from "@playwright/test";
import * as fs from "fs";

const SCRIPT_PATH = "./tampermonkey-script.js";

test("dump Notion topbar DOM structure", async ({ page }) => {
  // Navigate to a Notion page (user must be authenticated)
  await page.goto("/");
  // Wait for Notion's app to render (sidebar or frame appears)
  await page.waitForSelector(".notion-sidebar, .notion-frame, .notion-cursor-listener", {
    timeout: 30_000,
  });
  // Give extra time for Notion's React app to fully render
  await page.waitForTimeout(5000);

  // Check all the selectors used by the script
  const diagnostics = await page.evaluate(() => {
    const results = {};

    // 1. The main selector the script depends on
    results["notion-topbar-share-menu"] = {
      found: !!document.querySelector(".notion-topbar-share-menu"),
      count: document.querySelectorAll(".notion-topbar-share-menu").length,
    };

    // 2. General topbar
    results["notion-topbar"] = {
      found: !!document.querySelector(".notion-topbar"),
      count: document.querySelectorAll(".notion-topbar").length,
    };

    // 3. Other common Notion selectors
    const selectors = [
      ".notion-topbar-share-menu",
      ".notion-topbar-more-button",
      ".notion-topbar-action-buttons",
      ".notion-topbar-favorite-button",
      ".notion-page-controls",
      ".notion-frame",
      ".notion-cursor-listener",
      ".notion-sidebar",
      ".notion-peek-renderer",
      ".notion-record-icon",
      ".notion-page-block",
      '[aria-label="Share"]',
      '[aria-label="Share menu"]',
      '[aria-label="More"]',
    ];

    for (const sel of selectors) {
      try {
        const els = document.querySelectorAll(sel);
        results[sel] = {
          found: els.length > 0,
          count: els.length,
        };
      } catch {
        results[sel] = { found: false, error: "invalid selector" };
      }
    }

    // 4. Dump the topbar HTML structure (if topbar exists)
    const topbar = document.querySelector(".notion-topbar");
    if (topbar) {
      // Get a simplified view of the structure
      function summarize(el, depth = 0) {
        if (depth > 4) return "...";
        const tag = el.tagName?.toLowerCase() || "?";
        const cls = el.className
          ? typeof el.className === "string"
            ? `.${el.className.split(" ").join(".")}`
            : ""
          : "";
        const role = el.getAttribute?.("role")
          ? `[role="${el.getAttribute("role")}"]`
          : "";
        const ariaLabel = el.getAttribute?.("aria-label")
          ? `[aria-label="${el.getAttribute("aria-label")}"]`
          : "";
        const text =
          el.childNodes.length === 0 && el.textContent?.trim()
            ? ` "${el.textContent.trim().slice(0, 30)}"`
            : "";
        const children = Array.from(el.children || [])
          .map((c) => summarize(c, depth + 1))
          .filter(Boolean);
        const indent = "  ".repeat(depth);
        let result = `${indent}<${tag}${cls}${role}${ariaLabel}>${text}`;
        if (children.length > 0) {
          result += "\n" + children.join("\n");
        }
        return result;
      }
      results["topbar_structure"] = summarize(topbar);
    }

    // 5. Check for share-related buttons by text content
    const allButtons = document.querySelectorAll('[role="button"]');
    const shareButtons = [];
    allButtons.forEach((btn) => {
      const text = btn.textContent?.trim();
      if (
        text &&
        (text.toLowerCase().includes("share") ||
          text.toLowerCase().includes("publish"))
      ) {
        shareButtons.push({
          text,
          classes: btn.className,
          parentClasses: btn.parentElement?.className,
          ariaLabel: btn.getAttribute("aria-label"),
        });
      }
    });
    results["share_buttons_by_text"] = shareButtons;

    // 6. Check all elements with notion- prefixed classes
    const allElements = document.querySelectorAll('[class*="notion-"]');
    const notionClasses = new Set();
    allElements.forEach((el) => {
      if (typeof el.className === "string") {
        el.className.split(" ").forEach((c) => {
          if (c.startsWith("notion-")) notionClasses.add(c);
        });
      }
    });
    results["all_notion_classes"] = [...notionClasses].sort();

    return results;
  });

  // Write results to a file for inspection
  const output = JSON.stringify(diagnostics, null, 2);
  fs.writeFileSync("./test-results/dom-diagnostics.json", output);

  console.log("\n=== DOM DIAGNOSTICS ===\n");
  console.log(output);
  console.log("\n=== END DIAGNOSTICS ===\n");

  // The test "passes" — it's just for inspection
  expect(true).toBe(true);
});
