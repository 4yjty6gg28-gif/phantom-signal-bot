import type { Hono } from "hono";
import type { HttpBindings } from "@hono/node-server";
import { serveStatic } from "@hono/node-server/serve-static";
import fs from "fs";

type App = Hono<{ Bindings: HttpBindings }>;

// Safe way to get dist path that works in Node, Deno, and bundled environments
function getDistPath(): string {
  // Try common paths
  const candidates = [
    "./dist/public",
    "../dist/public",
    "../../dist/public",
    "/code/dist/public",
    "/app/dist/public",
  ];

  for (const p of candidates) {
    if (fs.existsSync(p)) {
      return p;
    }
  }

  // Default fallback
  return "./dist/public";
}

export function serveStaticFiles(app: App) {
  try {
    const distPath = getDistPath();
    console.log("[Static] Serving from:", distPath);

    app.use("*", serveStatic({ root: distPath }));

    app.notFound((c) => {
      const accept = c.req.header("accept") ?? "";
      if (!accept.includes("text/html")) {
        return c.json({ error: "Not Found" }, 404);
      }
      try {
        const indexPath = distPath + "/index.html";
        const content = fs.readFileSync(indexPath, "utf-8");
        return c.html(content);
      } catch {
        return c.json({ error: "index.html not found" }, 500);
      }
    });
  } catch (err: any) {
    console.error("[Static] Error setting up static files:", err.message);
    // Continue without static files - at least API works
  }
}
