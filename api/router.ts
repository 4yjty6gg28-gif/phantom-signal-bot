import { createRouter, publicQuery } from "./middleware";
import { signalRouter } from "./routers/signal";
import { settingsRouter } from "./routers/settings";
import { telegramRouter } from "./routers/telegram";
import { diagRouter } from "./routers/diag";

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
