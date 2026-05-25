import { Hono } from "hono";
import { bodyLimit } from "hono/body-limit";
import type { HttpBindings } from "@hono/node-server";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter } from "./router.js";
import { createContext } from "./context.js";
import { env } from "./lib/env.js";
import { initBot, getBot, autoSetWebhook } from "./telegram/bot.js";
import { getBotStatus } from "./telegram/bot.js";
import { getSetting } from "./services/settings.js";

const app = new Hono<{ Bindings: HttpBindings }>();

app.use(bodyLimit({ maxSize: 50 * 1024 * 1024 }));

// Telegram webhook endpoint
app.post("/api/telegram/webhook", async (c) => {
  console.log("[POST /api/telegram/webhook] Received at", new Date().toISOString());
  try {
    // Lazy init bot if not ready
    const b = await initBot();
    if (!b) {
      console.error("[Webhook] Bot init failed");
      return c.json({ error: "Bot not initialized" }, 500);
    }

    let body;
    try {
      body = await c.req.json();
    } catch {
      body = JSON.parse(await c.req.text());
    }

    console.log("[Webhook] update_id:", body.update_id, "type:", body.message ? "message" : body.callback_query ? "callback" : "other");

    const botInstance = getBot();
    if (!botInstance) {
      return c.json({ error: "Bot not available" }, 500);
    }

    await botInstance.handleUpdate(body);
    console.log("[Webhook] Handled OK");
    return c.json({ ok: true });
  } catch (err: any) {
    console.error("[Webhook] Error:", err.message);
    return c.json({ ok: true }); // Always return 200
  }
});

// Telegram bot debug status
app.get("/api/telegram/debug", async (c) => {
  const status = await getBotStatus();
  return c.json(status);
});

// Telegram setup: set webhook directly from server
app.get("/api/telegram/setup", async (c) => {
  try {
    const token = (await getSetting("TELEGRAM_BOT_TOKEN")) || process.env.TELEGRAM_BOT_TOKEN || "";
    if (!token) return c.json({ error: "No token configured" }, 500);

    // Get the request hostname (works behind reverse proxy too)
    const host = c.req.header("host") || c.req.header("x-forwarded-host");
    const proto = c.req.header("x-forwarded-proto") || "https";

    if (!host) {
      return c.json({ error: "Cannot detect hostname. Set APP_URL env var." }, 400);
    }

    const webhookUrl = `${proto}://${host}/api/telegram/webhook`;

    const res = await fetch(`https://api.telegram.org/bot${token}/setWebhook?url=${encodeURIComponent(webhookUrl)}`);
    const data = (await res.json()) as any;

    return c.json({
      telegramOk: data.ok,
      webhookUrl,
      telegramResponse: data,
    });
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
});

// Telegram test: try to send a message
app.get("/api/telegram/test", async (c) => {
  try {
    const token = (await getSetting("TELEGRAM_BOT_TOKEN")) || process.env.TELEGRAM_BOT_TOKEN || "";
    if (!token) return c.json({ error: "No token" }, 500);

    const chatId = c.req.query("chatId");
    if (!chatId) return c.json({ error: "Add ?chatId=YOUR_CHAT_ID" }, 400);

    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: "✅ Phantom Signal Bot is working!\n\nTry sending: XAUUSD",
      }),
    });
    const data = (await res.json()) as any;
    return c.json({
      telegramApiOk: data.ok,
      telegramResponse: data,
      networkWorking: true,
    });
  } catch (err: any) {
    return c.json({
      networkWorking: false,
      error: err.message,
      hint: "Server cannot reach Telegram API - outbound network blocked",
    }, 500);
  }
});

// tRPC endpoint
app.use("/api/trpc/*", async (c) => {
  return fetchRequestHandler({
    endpoint: "/api/trpc",
    req: c.req.raw,
    router: appRouter,
    createContext,
  });
});

// Health check
app.get("/api/health", (c) =>
  c.json({
    ok: true,
    ts: Date.now(),
    service: "phantom-signal-bot",
    version: "1.0.0",
  })
);

app.all("/api/*", (c) => c.json({ error: "Not Found" }, 404));

export default app;

if (env.isProduction) {
  const { serve } = await import("@hono/node-server");
  const { serveStaticFiles } = await import("./lib/vite.js");
  serveStaticFiles(app);

  const port = parseInt(process.env.PORT || "3000");

  // Start server first
  serve({ fetch: app.fetch, port }, async () => {
    console.log(`Server running on http://localhost:${port}/`);

    // Then init bot (after server is ready)
    try {
      const botReady = await initBot();
      console.log("[Startup] Bot init:", botReady ? "SUCCESS" : "FAILED (no token)");

      if (botReady) {
        const appUrl = process.env.APP_URL || process.env.VERCEL_URL || process.env.RAILWAY_STATIC_URL;
        if (appUrl) {
          await autoSetWebhook(appUrl);
        }
      }
    } catch (err: any) {
      console.error("[Startup] Bot init error:", err.message);
    }
  });
}
