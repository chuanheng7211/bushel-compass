#!/usr/bin/env node
/**
 * Take a root-base static prerender (.output/public) and rewrite it so it
 * can live on a GitHub project site at /bushel-compass/.
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
  return text
    .replaceAll("/assets/", `${PREFIX}/assets/`)
    .replaceAll("/__grok/", `${PREFIX}/__grok/`)
    .replaceAll("/favicon.svg", `${PREFIX}/favicon.svg`)
    .replaceAll("/og.jpg", `${PREFIX}/og.jpg`)
    .replaceAll("/data/", `${PREFIX}/data/`)
    .replaceAll('href="/origins"', `href="${PREFIX}/origins"`)
    .replaceAll('href="/board"', `href="${PREFIX}/board"`)
    .replaceAll('href="/world"', `href="${PREFIX}/world"`)
    .replaceAll('href="/industry"', `href="${PREFIX}/industry"`)
    .replaceAll('href="/"', `href="${PREFIX}/"`)
    .replaceAll("basepath:`/`", "basepath:`/bushel-compass`")
    .replaceAll('basepath:"/"', 'basepath:"/bushel-compass"')
    .replaceAll("basepath:'/'", "basepath:'/bushel-compass'");
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
