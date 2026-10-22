import { chromium } from "playwright";
import { mkdirSync } from "node:fs";
mkdirSync("/workspace/screenshots", { recursive: true });

const url = process.argv[2] || "https://chuanheng7211.github.io/bushel-compass/";
const browser = await chromium.launch({ args: ["--no-sandbox", "--disable-dev-shm-usage"] });
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
const errors = [];
const consoleMsgs = [];
const failed = [];
page.on("pageerror", (e) => errors.push(String(e)));
page.on("console", (m) => {
  const t = m.type();
  if (t === "error" || t === "warning") consoleMsgs.push(`${t}: ${m.text()}`);
});
page.on("requestfailed", (r) => failed.push(`${r.failure()?.errorText} ${r.url()}`));
page.on("response", (r) => {
  if (r.status() >= 400) failed.push(`HTTP ${r.status()} ${r.url()}`);
});

const res = await page.goto(url, { waitUntil: "networkidle", timeout: 30000 });
await page.waitForTimeout(1500);
const title = await page.title();
const h1 = await page.locator("h1").first().textContent().catch(() => null);
const body = (await page.locator("body").innerText()).slice(0, 500);
const buttons = await page.locator("button").count();
await page.screenshot({ path: "/workspace/screenshots/live-home.png", fullPage: true });

let afterClick = null;
const apples = page.getByRole("button", { name: /Apples/i }).first();
if (await apples.count()) {
  await apples.click();
  await page.waitForTimeout(800);
  afterClick = (await page.locator("body").innerText()).slice(0, 400);
  await page.screenshot({ path: "/workspace/screenshots/live-apples.png", fullPage: false });
}

let navUrl = null;
const world = page.getByRole("link", { name: /World/i }).first();
if (await world.count()) {
  await world.click();
  await page.waitForTimeout(1200);
  navUrl = page.url();
  await page.screenshot({ path: "/workspace/screenshots/live-world.png", fullPage: false });
}

console.log(JSON.stringify({
  status: res?.status(),
  finalUrl: page.url(),
  title, h1, buttons,
  body: body.slice(0, 300),
  afterClick: afterClick ? afterClick.slice(0, 250) : null,
  navUrl,
  errors,
  consoleMsgs: consoleMsgs.slice(0, 30),
  failed: failed.slice(0, 30),
}, null, 2));
await browser.close();
