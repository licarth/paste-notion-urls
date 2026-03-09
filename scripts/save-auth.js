/**
 * Interactive script to save Notion authentication state.
 * Run once with: npm run save-auth
 *
 * A browser window will open — log into Notion manually.
 * The script auto-detects when you're logged in and on a Notion page,
 * then saves the auth state to auth/notion.state.json for tests.
 */
import { chromium } from "playwright";
import * as fs from "fs";

const AUTH_DIR = "./auth";
const AUTH_FILE = `${AUTH_DIR}/notion.state.json`;

async function main() {
  if (!fs.existsSync(AUTH_DIR)) {
    fs.mkdirSync(AUTH_DIR, { recursive: true });
  }

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  await page.goto("https://www.notion.so/login");

  console.log("\n🔐 A browser window has opened.");
  console.log("   Log into your Notion account and navigate to any page.");
  console.log("   The script will auto-detect when you're logged in...\n");

  // Wait until the user is on an authenticated Notion page
  // (the sidebar or topbar appears, meaning they're logged in)
  await page.waitForSelector(".notion-sidebar, .notion-topbar", {
    timeout: 300_000, // 5 minutes to log in
  });

  // Give it a moment for the page to fully stabilize
  await page.waitForTimeout(2000);

  await context.storageState({ path: AUTH_FILE });
  console.log(`✅ Auth state saved to ${AUTH_FILE}`);

  await browser.close();
}

main().catch(console.error);
