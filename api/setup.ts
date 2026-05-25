// Vercel Serverless Function - Set Telegram webhook
// NO DATABASE needed - uses env var only

export default async function handler(request: Request): Promise<Response> {
  const token = process.env.TELEGRAM_BOT_TOKEN || "";
  
  if (!token) {
    return new Response(
      JSON.stringify({ 
        error: "TELEGRAM_BOT_TOKEN not set",
        fix: "Go to Vercel Dashboard > Settings > Environment Variables > Add TELEGRAM_BOT_TOKEN"
      }), 
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  const url = new URL(request.url);
  const hostname = url.hostname;
  const webhookUrl = `https://${hostname}/api/webhook`;

  try {
    const res = await fetch(
      `https://api.telegram.org/bot${token}/setWebhook?url=${encodeURIComponent(webhookUrl)}`
    );
    const data = (await res.json()) as any;

    return new Response(
      JSON.stringify({ 
        success: data.ok,
        webhookUrl,
        telegramResponse: data 
      }, null, 2),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
