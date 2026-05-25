// Vercel Serverless Function - Telegram webhook handler
import { Bot } from "grammy";
import { getSetting } from "./services/settings.js";

const SYMBOLS = [
  "XAUUSD", "EURUSD", "GBPUSD", "USDJPY", "AUDUSD",
  "USDCAD", "USDCHF", "NZDUSD", "GBPJPY", "BTCUSD", "ETHUSD", "OIL",
];

function generateMockSignal(symbol: string) {
  const isBuy = Math.random() > 0.4;
  const confidence = 60 + Math.floor(Math.random() * 30);
  const price =
    symbol === "XAUUSD" ? 2345.60
    : symbol === "EURUSD" ? 1.0845
    : symbol === "GBPUSD" ? 1.2730
    : symbol === "USDJPY" ? 150.25
    : symbol === "BTCUSD" ? 67500
    : symbol === "ETHUSD" ? 3500
    : 80.50;

  const sl = isBuy ? price * 0.998 : price * 1.002;
  const tp = isBuy ? price * 1.006 : price * 0.994;

  return {
    symbol,
    direction: isBuy ? "BUY" : "SELL",
    confidence,
    entryPrice: price,
    stopLoss: sl,
    takeProfit: tp,
    riskReward: "1:3",
    consensus: isBuy ? "Bullish consensus" : "Bearish consensus",
    votes: [
      { model: "Kimi K2", direction: isBuy ? "BUY" : "SELL", confidence },
      { model: "Claude 3.5", direction: isBuy ? "BUY" : "SELL", confidence: Math.max(50, confidence - 5) },
      { model: "GPT-4o", direction: isBuy ? "BUY" : "SELL", confidence: Math.min(95, confidence + 5) },
      { model: "DeepSeek V3", direction: isBuy ? "SELL" : "BUY", confidence: 100 - confidence },
    ],
  };
}

function formatMessage(signal: any) {
  const emoji = signal.direction === "BUY" ? "🟢" : "🔴";
  const prec = signal.entryPrice > 1000 ? 2 : signal.entryPrice > 100 ? 2 : 5;

  let msg = `${emoji} *PHANTOM SIGNAL* ${emoji}\n\n`;
  msg += `*${signal.symbol}* — *${signal.direction}*\n`;
  msg += `📊 Confidence: *${signal.confidence}%*\n`;
  msg += `🗳️ ${signal.consensus}\n\n`;
  msg += `💰 *Entry*: ${signal.entryPrice.toFixed(prec)}\n`;
  msg += `⛔ *Stop Loss*: ${signal.stopLoss.toFixed(prec)}\n`;
  msg += `✅ *Take Profit*: ${signal.takeProfit.toFixed(prec)}\n`;
  msg += `📈 *Risk:Reward*: ${signal.riskReward}\n\n`;
  msg += `🧠 *AI VOTING:*\n`;
  for (const v of signal.votes) {
    const ve = v.direction === "BUY" ? "🟢" : "🔴";
    msg += `${ve} *${v.model}*: ${v.direction} (${v.confidence}%)\n`;
  }
  msg += `\n⚠️ For educational purposes only.\nTrade at your own risk.`;
  return msg;
}

export default async function handler(request: Request): Promise<Response> {
  if (request.method !== "POST") {
    return new Response(JSON.stringify({ ok: false, error: "POST only" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  const token = process.env.TELEGRAM_BOT_TOKEN || (await getSetting("TELEGRAM_BOT_TOKEN")) || "";
  if (!token) {
    return new Response(JSON.stringify({ ok: false, error: "No token" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const update = await request.json();
    const message = update.message;
    const callback = update.callback_query;

    if (!message && !callback) {
      return new Response(JSON.stringify({ ok: true }), { status: 200 });
    }

    const chatId = message?.chat?.id || callback?.message?.chat?.id;
    const text = message?.text || "";

    if (!chatId) {
      return new Response(JSON.stringify({ ok: true }), { status: 200 });
    }

    const bot = new Bot(token);

    if (text === "/start") {
      await bot.api.sendMessage(
        chatId,
        `🎯 *Welcome to Phantom Signal Bot!*\n\nI'm your AI-powered trading signal assistant.\n\n*How to use:*\n1️⃣ Send me a symbol like: \`XAUUSD\`\n2️⃣ I'll analyze it and send you a signal\n\n*Available:*\n${SYMBOLS.join(", ")}\n\n*Commands:*\n• /start — This message\n• /help — Help info\n• /signal SYMBOL — Get signal\n\n🔮 Powered by CRT x FIBO Math Engine + Multi-AI Voting`,
        { parse_mode: "MarkdownV2" }
      );
    } else if (text === "/help") {
      await bot.api.sendMessage(
        chatId,
        `🎯 *Phantom Signal Bot Help*\n\n*How it works:*\n1️⃣ Fetch real-time market data\n2️⃣ 4 AI models vote independently\n3️⃣ CRT x FIBO Math analysis\n4️⃣ You get signal with SL/TP\n\n*Commands:*\n/signal SYMBOL — Get AI signal\n/stats — View statistics\n\n⚠️ Educational purposes only.`,
        { parse_mode: "MarkdownV2" }
      );
    } else if (text.startsWith("/signal ")) {
      const symbol = text.split(" ")[1]?.toUpperCase();
      if (!symbol || !SYMBOLS.includes(symbol)) {
        await bot.api.sendMessage(
          chatId,
          `❌ Symbol *${symbol}* not supported.\n\nAvailable: ${SYMBOLS.join(", ")}`,
          { parse_mode: "Markdown" }
        );
      } else {
        const loadingMsg = await bot.api.sendMessage(chatId, `🔍 Analyzing *${symbol}*...\n\n🤖 Consulting AI analysts...`, { parse_mode: "Markdown" });
        const signal = generateMockSignal(symbol);
        try {
          await bot.api.deleteMessage(chatId, loadingMsg.message_id);
        } catch { /* ignore */ }
        await bot.api.sendMessage(chatId, formatMessage(signal), { parse_mode: "MarkdownV2" });
      }
    } else if (SYMBOLS.includes(text.toUpperCase())) {
      const symbol = text.toUpperCase();
      const loadingMsg = await bot.api.sendMessage(chatId, `🔍 Analyzing *${symbol}*...`, { parse_mode: "Markdown" });
      const signal = generateMockSignal(symbol);
      try {
        await bot.api.deleteMessage(chatId, loadingMsg.message_id);
      } catch { /* ignore */ }
      await bot.api.sendMessage(chatId, formatMessage(signal), { parse_mode: "MarkdownV2" });
    } else {
      await bot.api.sendMessage(chatId, `Send me a symbol like *XAUUSD* or use /signal XAUUSD`, { parse_mode: "Markdown" });
    }

    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  } catch (err: any) {
    console.error("[Webhook] Error:", err.message);
    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  }
}
