import { createRouter, publicQuery } from "../middleware";
import { getSetting } from "../services/settings";

export const diagRouter = createRouter({
  full: publicQuery.query(async () => {
    const results: Record<string, any> = {};
    const startTime = Date.now();

    // 1. Check token
    let token = "";
    try {
      token = (await getSetting("TELEGRAM_BOT_TOKEN")) || process.env.TELEGRAM_BOT_TOKEN || "";
      results.token = { exists: token.length > 0, prefix: token ? token.split(":")[0] : "" };
    } catch (e: any) {
      results.token = { error: e.message };
    }

    // 2. Test DNS resolution
    try {
      const dnsStart = Date.now();
      const res = await fetch("https://api.telegram.org", { method: "HEAD", signal: AbortSignal.timeout(5000) });
      results.dns = { ok: true, latencyMs: Date.now() - dnsStart, status: res.status };
    } catch (e: any) {
      results.dns = { ok: false, error: e.message };
    }

    // 3. Test Telegram getMe (no chat needed)
    if (token) {
      try {
        const meStart = Date.now();
        const res = await fetch(`https://api.telegram.org/bot${token}/getMe`, { signal: AbortSignal.timeout(10000) });
        const data = (await res.json()) as any;
        results.telegramGetMe = {
          ok: data.ok,
          latencyMs: Date.now() - meStart,
          botUsername: data.result?.username,
          botName: data.result?.first_name,
          error: data.description,
        };
      } catch (e: any) {
        results.telegramGetMe = { ok: false, error: e.message };
      }
    }

    // 4. Test webhook info
    if (token) {
      try {
        const res = await fetch(`https://api.telegram.org/bot${token}/getWebhookInfo`, { signal: AbortSignal.timeout(10000) });
        const data = (await res.json()) as any;
        results.webhookInfo = {
          ok: data.ok,
          url: data.result?.url,
          hasCustomCertificate: data.result?.has_custom_certificate,
          pendingUpdateCount: data.result?.pending_update_count,
          lastErrorDate: data.result?.last_error_date,
          lastErrorMessage: data.result?.last_error_message,
          maxConnections: data.result?.max_connections,
          ipAddress: data.result?.ip_address,
        };
      } catch (e: any) {
        results.webhookInfo = { ok: false, error: e.message };
      }
    }

    // 5. Node version & env
    results.runtime = {
      nodeVersion: process.version,
      platform: process.platform,
      env: process.env.NODE_ENV || "development",
    };

    results.totalLatencyMs = Date.now() - startTime;
    return results;
  }),
});
