import { chromium } from "playwright";
const browser = await chromium.launch({ args: ["--no-sandbox", "--disable-dev-shm-usage"] });
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
page.on("response", async (r) => {
  if (r.url().includes("bushel-compass") && !r.url().includes("assets")) {
    console.log("RESP", r.status(), r.url(), r.headers()["content-type"]);
  }
});
const res = await page.goto("https://chuanheng7211.github.io/bushel-compass/", { waitUntil: "commit", timeout: 30000 });
console.log("goto status", res?.status(), "url", page.url());
console.log("headers", await res?.allHeaders());
const html = await page.content();
console.log("content len", html.length);
console.log(html.slice(0, 800));
await page.waitForTimeout(2000);
const html2 = await page.content();
console.log("after2s len", html2.length);
console.log(html2.slice(0, 500));
await browser.close();
