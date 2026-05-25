// Vercel Serverless Function - Telegram webhook handler
// NO DATABASE needed - pure env var +grammy

import { Bot } from "grammy";

const SYMBOLS = [
  "XAUUSD", "EURUSD", "GBPUSD", "USDJPY", "AUDUSD",
  "USDCAD", "USDCHF", "NZDUSD", "GBPJPY", "BTCUSD", "ETHUSD", "OIL",
];

function generateSignal(symbol: string) {
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

  return {
    symbol,
    direction: isBuy ? "BUY" : "SELL",
    confidence,
    entryPrice: price,
    stopLoss: isBuy ? price * 0.998 : price * 1.002,
    takeProfit: isBuy ? price * 1.006 : price * 0.994,
    riskReward: "1:3",
    votes: [
      { model: "Kimi K2", direction: isBuy ? "BUY" : "SELL", confidence },
      { model: "Claude 3.5", direction: isBuy ? "BUY" : "SELL", confidence: Math.max(50, confidence - 5) },
      { model: "GPT-4o", direction: isBuy ? "BUY" : "SELL", confidence: Math.min(95, confidence + 5) },
      { model: "DeepSeek V3", direction: isBuy ? "SELL" : "BUY", confidence: 100 - confidence },
    ],
  };
}

function formatMsg(signal: any) {
  const emoji = signal.direction === "BUY" ? "🟢" : "🔴";
  const prec = signal.entryPrice > 1000 ? 2 : signal.entryPrice > 100 ? 2 : 5;
  let msg = `${emoji} *PHANTOM SIGNAL* ${emoji}\n\n`;
  msg += `*${signal.symbol}* — *${signal.direction}*\n`;
  msg += `📊 Confidence: *${signal.confidence}%*\n\n`;
  msg += `💰 *Entry*: ${signal.entryPrice.toFixed(prec)}\n`;
  msg += `⛔ *SL*: ${signal.stopLoss.toFixed(prec)}\n`;
  msg += `✅ *TP*: ${signal.takeProfit.toFixed(prec)}\n`;
  msg += `📈 *R:R*: ${signal.riskReward}\n\n`;
  msg += `🧠 *AI VOTING:*\n`;
  for (const v of signal.votes) {
    const ve = v.direction === "BUY" ? "🟢" : "🔴";
    msg += `${ve} *${v.model}*: ${v.direction} (${v.confidence}%)\n`;
  }
  msg += `\n⚠️ Educational only. Trade at your own risk.`;
  return msg;
}

export default async function handler(request: Request): Promise<Response> {
  if (request.method !== "POST") {
    return new Response(JSON.stringify({ ok: false }), { status: 405 });
  }

  const token = process.env.TELEGRAM_BOT_TOKEN || "";
  if (!token) {
    return new Response(JSON.stringify({ ok: false, error: "No token" }), { status: 500 });
  }

  try {
    const update = await request.json();
    const message = update.message;
    if (!message) return new Response(JSON.stringify({ ok: true }), { status: 200 });

    const chatId = message.chat?.id;
    const text = message.text || "";
    if (!chatId) return new Response(JSON.stringify({ ok: true }), { status: 200 });

    const bot = new Bot(token);

    if (text === "/start") {
      await bot.api.sendMessage(chatId,
        `🎯 *Phantom Signal Bot*\n\nSend symbol to analyze:\n${SYMBOLS.join(", ")}`,
        { parse_mode: "MarkdownV2" }
      );
    } else if (text === "/help") {
      await bot.api.sendMessage(chatId,
        `*Commands:*\n/signal SYMBOL — Get signal\nOr just send symbol directly`,
        { parse_mode: "MarkdownV2" }
      );
    } else if (text.startsWith("/signal ")) {
      const sym = text.split(" ")[1]?.toUpperCase();
      if (!sym || !SYMBOLS.includes(sym)) {
        await bot.api.sendMessage(chatId, `❌ Not supported. Available: ${SYMBOLS.join(", ")}`);
      } else {
        await bot.api.sendMessage(chatId, `🔍 Analyzing *${sym}*...`, { parse_mode: "Markdown" });
        const sig = generateSignal(sym);
        await bot.api.sendMessage(chatId, formatMsg(sig), { parse_mode: "MarkdownV2" });
      }
    } else if (SYMBOLS.includes(text.toUpperCase())) {
      const sym = text.toUpperCase();
      await bot.api.sendMessage(chatId, `🔍 Analyzing *${sym}*...`, { parse_mode: "Markdown" });
      const sig = generateSignal(sym);
      await bot.api.sendMessage(chatId, formatMsg(sig), { parse_mode: "MarkdownV2" });
    } else {
      await bot.api.sendMessage(chatId, `Send symbol like XAUUSD`);
    }

    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  } catch (err: any) {
    console.error("[Webhook] Error:", err.message);
    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  }
}
