#!/usr/bin/env node
/**
 * Take a root-base static prerender (.output/public) and rewrite it so it
 * can live on a GitHub project site at /bushel-compass/.
 *
 * TanStack Start's client bundle hydrates `document` and blanks the desk on
 * GitHub Pages (wrong chunk base + empty router basepath). The prerendered
 * HTML is the product; strip the Start scripts so the page stays on screen.
 */
import { cpSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { join, extname } from "node:path";

const SRC = ".output/public";
const DST = ".output/gh-pages";
const PREFIX = "/bushel-compass";
const TEXT_EXT = new Set([".html", ".js", ".css", ".json", ".svg", ".webmanifest", ".txt", ".map"]);

function walk(dir, files = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, files);
    else files.push(p);
  }
  return files;
}

function rewrite(text) {
  let out = text
    .replaceAll("/assets/", `${PREFIX}/assets/`)
    .replaceAll("/__grok/", `${PREFIX}/__grok/`)
    .replaceAll("/favicon.svg", `${PREFIX}/favicon.svg`)
    .replaceAll("/og.jpg", `${PREFIX}/og.jpg`)
    .replaceAll("/data/", `${PREFIX}/data/`)
    .replaceAll('href="/origins"', `href="${PREFIX}/origins/"`)
    .replaceAll('href="/board"', `href="${PREFIX}/board/"`)
    .replaceAll('href="/world"', `href="${PREFIX}/world/"`)
    .replaceAll('href="/industry"', `href="${PREFIX}/industry/"`)
    .replaceAll('href="/"', `href="${PREFIX}/"`)
    .replaceAll("basepath:`/`", "basepath:`/bushel-compass`")
    .replaceAll("update({basepath:``", "update({basepath:`/bushel-compass`")
    .replaceAll("function(e){return`/`+e}", "function(e){return`/bushel-compass/`+e}");
  if (extname) {
    out = out
      .replace(/<script class="\$tsr"[^>]*>[\s\S]*?<\/script>/g, "")
      .replace(/<script type="module"[^>]*src="[^"]*index-[^"]+"[^>]*><\/script>/g, "")
      .replace(/<link rel="modulepreload" href="[^"]*assets\/[^"]+"[^>]*\/?>/g, "");
  }
  return out;
}

mkdirSync(".output", { recursive: true });
cpSync(SRC, DST, { recursive: true });
writeFileSync(join(DST, ".nojekyll"), "");

let n = 0;
for (const file of walk(DST)) {
  if (!TEXT_EXT.has(extname(file))) continue;
  const before = readFileSync(file, "utf8");
  const after = rewrite(before);
  if (after !== before) {
    writeFileSync(file, after);
    n += 1;
  }
}

cpSync(join(DST, "index.html"), join(DST, "404.html"));
console.log(`[gh-pages] rewrote ${n} files under ${DST}`);
