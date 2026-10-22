import { defineEventHandler, getQuery } from "h3";
import { fetchQuotes } from "../../../src/lib/yahoo-quotes";

export default defineEventHandler(async (event) => {
  const q = getQuery(event);
  const raw = typeof q.symbols === "string" ? q.symbols : "";
  const symbols = raw.split(",").map((s) => s.trim()).filter(Boolean);
  const quotes = await fetchQuotes(symbols);
  return { delayed: true, asof: new Date().toISOString(), quotes };
});
