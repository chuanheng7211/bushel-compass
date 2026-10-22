import { chromium } from "playwright";
const browser = await chromium.launch({ args: ["--no-sandbox", "--disable-dev-shm-usage"] });
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
const out = {};
async function shot(name, url) {
  const errors = [];
  page.removeAllListeners("pageerror");
  page.on("pageerror", (e) => errors.push(String(e)));
  await page.goto(url, { waitUntil: "networkidle", timeout: 30000 });
  await page.waitForTimeout(500);
  const text = (await page.locator("body").innerText()).slice(0, 400);
  await page.screenshot({ path: `/workspace/screenshots/${name}.png`, fullPage: false });
  out[name] = { url: page.url(), title: await page.title(), buttons: await page.locator("button").count(), text, errors };
}
await shot("live-home", "https://chuanheng7211.github.io/bushel-compass/");
await shot("live-world", "https://chuanheng7211.github.io/bushel-compass/world/");
await shot("live-board", "https://chuanheng7211.github.io/bushel-compass/board/");
await shot("live-origins", "https://chuanheng7211.github.io/bushel-compass/origins/");
// click World from home
await page.goto("https://chuanheng7211.github.io/bushel-compass/", { waitUntil: "networkidle" });
await page.getByRole("link", { name: "World" }).click();
await page.waitForTimeout(800);
out.clickWorld = { url: page.url(), text: (await page.locator("body").innerText()).slice(0, 250) };
await page.screenshot({ path: "/workspace/screenshots/live-click-world.png" });
console.log(JSON.stringify(out, null, 2));
await browser.close();
