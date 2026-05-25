import { z } from "zod";
import { createRouter, publicQuery } from "../middleware";
import { getSetting } from "../services/settings";

export const telegramRouter = createRouter({
  setWebhook: publicQuery.query(async () => {
    const token = (await getSetting("TELEGRAM_BOT_TOKEN")) || "";
    if (!token) {
      return { success: false, error: "Token belum diisi. Isi dulu di Pengaturan." };
    }

    // Detect the deployed URL from env or request
    const appUrl = process.env.APP_URL || process.env.VERCEL_URL || process.env.RAILWAY_STATIC_URL;
    if (!appUrl) {
      return {
        success: false,
        error: "URL deploy tidak terdeteksi. Set APP_URL di environment variable.",
      };
    }

    const webhookUrl = `https://${appUrl.replace(/^https?:\/\//, "")}/api/telegram/webhook`;

    try {
      const res = await fetch(
        `https://api.telegram.org/bot${token}/setWebhook?url=${encodeURIComponent(webhookUrl)}`
      );
      const data = (await res.json()) as any;

      if (data.ok) {
        return {
          success: true,
          message: "Webhook berhasil di-set! Bot sudah aktif.",
          webhookUrl,
        };
      } else {
        return {
          success: false,
          error: data.description || "Gagal set webhook",
        };
      }
    } catch (err: any) {
      return { success: false, error: err.message || "Network error" };
    }
  }),

  checkWebhook: publicQuery.query(async () => {
    const token = (await getSetting("TELEGRAM_BOT_TOKEN")) || "";
    if (!token) return { configured: false, info: null };

    try {
      const res = await fetch(`https://api.telegram.org/bot${token}/getWebhookInfo`);
      const data = (await res.json()) as any;
      return {
        configured: data.ok && data.result?.url,
        info: data.result || null,
      };
    } catch {
      return { configured: false, info: null };
    }
  }),

  generateWebhookUrl: publicQuery
    .input(z.object({ deployUrl: z.string().min(1) }))
    .query(async ({ input }) => {
      const token = (await getSetting("TELEGRAM_BOT_TOKEN")) || "";
      if (!token) return { error: "Token belum diisi" };

      const cleanUrl = input.deployUrl.replace(/\/$/, "").replace(/^https?:\/\//, "");
      const webhookUrl = `https://${cleanUrl}/api/telegram/webhook`;
      const browserUrl = `https://api.telegram.org/bot${token}/setWebhook?url=${encodeURIComponent(webhookUrl)}`;

      return { webhookUrl, browserUrl };
    }),
});
