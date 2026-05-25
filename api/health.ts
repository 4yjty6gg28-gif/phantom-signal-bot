export default function handler(request: Request): Response {
  return new Response(
    JSON.stringify({ ok: true, ts: Date.now(), service: "phantom-signal-bot" }),
    { status: 200, headers: { "Content-Type": "application/json" } }
  );
}
