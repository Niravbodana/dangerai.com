import { chromium } from "playwright";
import { mkdir } from "fs/promises";

const OUT = "/opt/cursor/artifacts/screenshots/post-login-recipes.png";

await mkdir("/opt/cursor/artifacts/screenshots", { recursive: true });

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });

await page.goto("http://localhost:3000/?auth=login", { waitUntil: "networkidle" });
await page.waitForTimeout(800);

await page.fill('input[type="email"]', "demo@rasoira.com");
await page.fill('input[type="password"]', "demo123");
await page.click('button:has-text("Log In")');

await page.waitForURL("**/recipes**", { timeout: 15000 });
await page.waitForTimeout(2000);

await page.screenshot({ path: OUT, fullPage: false });
console.log("Saved:", OUT);

await browser.close();
