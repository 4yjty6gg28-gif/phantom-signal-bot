// Vercel Serverless Function - Settings REST API

export default async function handler(request: Request): Promise<Response> {
  if (request.method === "GET") {
    return new Response(
      JSON.stringify({
        settings: [
          { key: "TELEGRAM_BOT_TOKEN", value: "***hidden***", description: "Token from @BotFather" },
        ],
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  }

  if (request.method === "POST") {
    const body = await request.json();
    // In Vercel, we can't persist settings (no writable DB)
    // User should set via Environment Variables in dashboard
    return new Response(
      JSON.stringify({
        success: true,
        message: "Set TELEGRAM_BOT_TOKEN in Vercel Dashboard > Settings > Environment Variables",
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  }

  return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405 });
}
