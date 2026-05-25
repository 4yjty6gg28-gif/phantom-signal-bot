import { createRouter, publicQuery } from "./middleware.js";
import { signalRouter } from "./routers/signal.js";
import { settingsRouter } from "./routers/settings.js";
import { telegramRouter } from "./routers/telegram.js";
import { diagRouter } from "./routers/diag.js";

export const appRouter = createRouter({
  ping: publicQuery.query(() => ({ ok: true, ts: Date.now() })),

  // Trading signal routes
  signal: signalRouter,

  // Settings routes
  settings: settingsRouter,

  // Telegram webhook routes
  telegram: telegramRouter,

  // Diagnosis routes
  diag: diagRouter,
});

export type AppRouter = typeof appRouter;
