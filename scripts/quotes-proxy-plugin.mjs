/** Dev-only /api/quotes — Yahoo delayed chart, same-origin for the desk. */
export function quotesProxyPlugin() {
  return {
    name: "bushel-quotes-proxy",
    apply: "serve",
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const pathOnly = (req.url ?? "").split("?", 1)[0] ?? "";
        if (pathOnly !== "/api/quotes") {
          next();
          return;
        }
        if ((req.method ?? "GET").toUpperCase() !== "GET") {
          res.statusCode = 405;
          res.end("Method Not Allowed");
          return;
        }
        try {
          const u = new URL(req.url ?? "/", "http://127.0.0.1");
          const symbols = (u.searchParams.get("symbols") || "")
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean);
          const mod = await server.ssrLoadModule("/src/lib/yahoo-quotes.ts");
          const quotes = await mod.fetchQuotes(symbols);
          res.statusCode = 200;
          res.setHeader("content-type", "application/json; charset=utf-8");
          res.setHeader("cache-control", "no-store");
          res.end(JSON.stringify({ delayed: true, asof: new Date().toISOString(), quotes }));
        } catch (err) {
          console.error("[quotes]", err);
          res.statusCode = 502;
          res.setHeader("content-type", "application/json");
          res.end(JSON.stringify({ delayed: true, quotes: [], error: "yahoo unreachable" }));
        }
      });
    },
  };
}
