import { Bot } from "grammy";
import { generateSignal, formatSignalMessage, getSignalStats } from "../services/signal.js";
import { getSetting } from "../services/settings.js";

// ─── Global bot instance ───
let bot: Bot | null = null;

/**
 * Pre-initialize bot at server startup (not lazy!)
 * This ensures bot is ready BEFORE webhook is called
 */
export async function initBot(): Promise<boolean> {
  if (bot) return true;

  let token = process.env.TELEGRAM_BOT_TOKEN || "";

  if (!token) {
    try {
      token = (await getSetting("TELEGRAM_BOT_TOKEN")) || "";
    } catch {
      // ignore
    }
  }

  if (!token) {
    console.warn("⚠️ No TELEGRAM_BOT_TOKEN found. Bot not initialized.");
    return false;
  }

  console.log("[Bot] Initializing with token prefix:", token.split(":")[0]);
  bot = new Bot(token);
  setupBotHandlers(bot);
  console.log("[Bot] Initialized successfully!");
  return true;
}

/**
 * Get existing bot instance (must call initBot() first!)
 */
export function getBot(): Bot | null {
  return bot;
}

// ─── Available Trading Symbols ───
const AVAILABLE_SYMBOLS = [
  "XAUUSD", "EURUSD", "GBPUSD", "USDJPY", "AUDUSD",
  "USDCAD", "USDCHF", "NZDUSD", "GBPJPY", "BTCUSD",
  "ETHUSD", "OIL",
];

function setupBotHandlers(b: Bot) {
  b.command("start", async (ctx) => {
    await ctx.reply(
      `🎯 *Welcome to Phantom Signal Bot!*

I'm your AI-powered trading assistant.

*How to use me:*
1️⃣ Send me a symbol: \`XAUUSD\`
2️⃣ I'll analyze it and send you a signal

*Available:* ${AVAILABLE_SYMBOLS.join(", ")}

*Commands:*
• /start — This message
• /help — Help info
• /stats — Bot statistics

⚠️ Signals are for educational purposes only.`,
      { parse_mode: "MarkdownV2" }
    );
  });

  b.command("help", async (ctx) => {
    await ctx.reply(
      `🎯 *Phantom Signal Bot*

*How it works:*
1. I fetch real-time market data
2. 4 AI models analyze independently:
   • Kimi K2
   • Claude 3.5
   • GPT-4o
   • DeepSeek V3
3. I combine their votes + CRT×FIBO math analysis
4. You get signal with SL/TP levels

⚠️ *Risk Warning:* Trading involves significant risk.`,
      { parse_mode: "MarkdownV2" }
    );
  });

  b.command("signal", async (ctx) => {
    const args = ctx.message?.text?.split(" ").slice(1);
    const symbol = args?.[0]?.toUpperCase();

    if (!symbol) {
      await ctx.reply("❌ Please provide a symbol. Example: \`/signal XAUUSD\`", { parse_mode: "Markdown" });
      return;
    }

    if (!AVAILABLE_SYMBOLS.includes(symbol)) {
      await ctx.reply(`❌ Symbol *${symbol}* not supported.\nAvailable: ${AVAILABLE_SYMBOLS.join(", ")}`, { parse_mode: "Markdown" });
      return;
    }

    const loadingMsg = await ctx.reply(
      `🔍 Analyzing *${symbol}*...\n\n🤖 Consulting AI analysts...`,
      { parse_mode: "Markdown" }
    );

    try {
      const signal = await generateSignal(symbol, "M15", ctx.chat?.id.toString());
      await ctx.api.deleteMessage(ctx.chat!.id, loadingMsg.message_id);
      const message = formatSignalMessage(signal);
      await ctx.reply(message, { parse_mode: "MarkdownV2" });
    } catch (error: any) {
      console.error("Error generating signal:", error);
      try {
        await ctx.api.deleteMessage(ctx.chat!.id, loadingMsg.message_id);
      } catch { /* ignore */ }
      await ctx.reply(
        `❌ Error analyzing *${symbol}*.\nPlease try again later.`,
        { parse_mode: "Markdown" }
      );
    }
  });

  b.command("stats", async (ctx) => {
    try {
      const stats = await getSignalStats();
      const message = `📊 *Phantom Signal Stats*

Total Signals: *${stats.total}*
🟢 BUY: ${stats.buyCount}
🔴 SELL: ${stats.sellCount}
⚪ NEUTRAL: ${stats.neutralCount}
📈 Avg Confidence: *${stats.avgConfidence}%*`;
      await ctx.reply(message, { parse_mode: "MarkdownV2" });
    } catch {
      await ctx.reply("❌ Error fetching stats.");
    }
  });

  b.on("message:text", async (ctx) => {
    const text = ctx.message.text.toUpperCase().trim();
    if (!AVAILABLE_SYMBOLS.includes(text)) {
      await ctx.reply(
        "Send me a symbol like *XAUUSD* or use /signal XAUUSD",
        { parse_mode: "Markdown" }
      );
      return;
    }

    const loadingMsg = await ctx.reply(
      `🔍 Analyzing *${text}*...`,
      { parse_mode: "Markdown" }
    );
    try {
      const signal = await generateSignal(text, "M15", ctx.chat?.id.toString());
      await ctx.api.deleteMessage(ctx.chat!.id, loadingMsg.message_id);
      const message = formatSignalMessage(signal);
      await ctx.reply(message, { parse_mode: "MarkdownV2" });
    } catch (error: any) {
      console.error("Error generating signal:", error);
      try {
        await ctx.api.deleteMessage(ctx.chat!.id, loadingMsg.message_id);
      } catch { /* ignore */ }
      await ctx.reply(`❌ Error. Try again later.`, { parse_mode: "Markdown" });
    }
  });

  b.catch((err) => {
    console.error("Telegram bot error:", err);
  });
}

// ─── Debug Bot Status ───
export async function getBotStatus() {
  const token =
    process.env.TELEGRAM_BOT_TOKEN || (await getSetting("TELEGRAM_BOT_TOKEN")) || "";
  return {
    hasToken: token.length > 0,
    tokenPrefix: token ? token.split(":")[0] : "",
    botInitialized: bot !== null,
  };
}

// ─── Auto-set webhook on startup ───
export async function autoSetWebhook(appUrl: string): Promise<void> {
  const b = getBot();
  if (!b) return;

  const webhookUrl = `https://${appUrl}/api/telegram/webhook`;
  try {
    await b.api.setWebhook(webhookUrl);
    console.log("[Bot] Webhook set to:", webhookUrl);
  } catch (err: any) {
    console.error("[Bot] Failed to set webhook:", err.message);
  }
}

// ─── Webhook Handler for Hono ───
// Bot MUST be pre-initialized via initBot() before this is called!
export function createTelegramWebhookHandler() {
  return async (c: any) => {
    try {
      const b = getBot();
      if (!b) {
        console.error("[Webhook] Bot not pre-initialized!");
        return c.json({ error: "Bot not ready" }, 500);
      }

      const body = await c.req.json();
      await b.handleUpdate(body);
      return c.json({ ok: true });
    } catch (err: any) {
      console.error("[Webhook] Error:", err.message);
      return c.json({ ok: true });
    }
  };
}
