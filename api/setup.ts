// Vercel Serverless Function - Telegram webhook setup
import { getSetting } from "./services/settings.js";

export default async function handler(request: Request): Promise<Response> {
  const token = process.env.TELEGRAM_BOT_TOKEN || (await getSetting("TELEGRAM_BOT_TOKEN")) || "";
  
  if (!token) {
    return new Response(JSON.stringify({ error: "TELEGRAM_BOT_TOKEN not set in environment variables" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Get hostname from request
  const url = new URL(request.url);
  const hostname = url.hostname;
  const webhookUrl = `https://${hostname}/api/webhook`;

  try {
    const res = await fetch(
      `https://api.telegram.org/bot${token}/setWebhook?url=${encodeURIComponent(webhookUrl)}`
    );
    const data = (await res.json()) as any;

    return new Response(
      JSON.stringify({ telegramOk: data.ok, webhookUrl, telegramResponse: data }, null, 2),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
