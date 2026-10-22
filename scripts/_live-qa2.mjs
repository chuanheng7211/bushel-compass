import { chromium } from "playwright";
const url = process.argv[2];
const browser = await chromium.launch({ args: ["--no-sandbox", "--disable-dev-shm-usage"] });
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
const errors = [];
page.on("pageerror", (e) => errors.push(e.stack || String(e)));
page.on("console", (m) => { if (m.type()==="error") errors.push("console "+m.text()); });
await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });
await page.waitForTimeout(400);
const before = {
  buttons: await page.locator("button").count(),
  text: (await page.locator("body").innerText()).slice(0,180),
  htmlLen: (await page.content()).length,
};
await page.waitForTimeout(2500);
const after = {
  buttons: await page.locator("button").count(),
  text: (await page.locator("body").innerText()).slice(0,300),
  htmlLen: (await page.content()).length,
  title: await page.title(),
  url: page.url(),
};
await page.screenshot({ path: "/workspace/screenshots/live-after.png", fullPage: true });
console.log(JSON.stringify({ before, after, errors: errors.slice(0,8) }, null, 2));
await browser.close();
