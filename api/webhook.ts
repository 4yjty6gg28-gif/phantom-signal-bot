import { Bot } from "grammy";

// Available symbols
const SYMBOLS = ["XAUUSD","EURUSD","GBPUSD","USDJPY","AUDUSD","USDCAD","USDCHF","NZDUSD","GBPJPY","BTCUSD","ETHUSD","OIL"];

// Mock signal for now (Vercel edge - no DB)
function generateMockSignal(symbol: string) {
  const isBuy = Math.random() > 0.4;
  const confidence = 60 + Math.floor(Math.random() * 30);
  const price = symbol === "XAUUSD" ? 2345.60 : symbol === "EURUSD" ? 1.0845 : 150.25;
  
  return {
    symbol,
    direction: isBuy ? "BUY" : "SELL",
    confidence,
    entryPrice: price,
    stopLoss: isBuy ? price - (price * 0.002) : price + (price * 0.002),
    takeProfit: isBuy ? price + (price * 0.006) : price - (price * 0.006),
    riskReward: "1:3",
    votes: [
      { model: "Kimi K2", direction: isBuy ? "BUY" : "SELL", confidence },
      { model: "Claude 3.5", direction: isBuy ? "BUY" : "SELL", confidence: confidence - 5 },
      { model: "GPT-4o", direction: isBuy ? "BUY" : "SELL", confidence: confidence + 5 },
      { model: "DeepSeek V3", direction: isBuy ? "SELL" : "BUY", confidence: 100 - confidence },
    ],
  };
}

function formatMessage(signal: any) {
  const emoji = signal.direction === "BUY" ? "🟢" : "🔴";
  const prec = signal.entryPrice > 1000 ? 2 : 5;
  
  let msg = `${emoji} *PHANTOM SIGNAL* ${emoji}\n\n`;
  msg += `*${signal.symbol}* — ${signal.direction}\n`;
  msg += `📊 Confidence: *${signal.confidence}%*\n\n`;
  msg += `💰 *Entry*: ${signal.entryPrice.toFixed(prec)}\n`;
  msg += `⛔ *Stop Loss*: ${signal.stopLoss.toFixed(prec)}\n`;
  msg += `✅ *Take Profit*: ${signal.takeProfit.toFixed(prec)}\n`;
  msg += `📈 *Risk:Reward*: ${signal.riskReward}\n\n`;
  msg += `🧠 *AI VOTING:*\n`;
  for (const v of signal.votes) {
    const ve = v.direction === "BUY" ? "🟢" : "🔴";
    msg += `${ve} *${v.model}*: ${v.direction} (${v.confidence}%)\n`;
  }
  msg += `\n⚠️ For educational purposes only.`;
  return msg;
}

// Main handler
export default async function handler(request: Request): Promise<Response> {
  // Only accept POST
  if (request.method !== "POST") {
    return new Response(JSON.stringify({ ok: false, error: "POST only" }), { 
      status: 405,
      headers: { "Content-Type": "application/json" }
    });
  }

  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    return new Response(JSON.stringify({ ok: false, error: "No token" }), { 
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }

  try {
    const update = await request.json();
    
    // Extract message info
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

    // Initialize bot
    const bot = new Bot(token);

    // Handle commands
    if (text === "/start") {
      await bot.api.sendMessage(chatId, 
        `🎯 *Welcome to Phantom Signal Bot!*\n\nSend me a symbol to analyze:\n${SYMBOLS.join(", ")}\n\nOr type /signal XAUUSD`,
        { parse_mode: "MarkdownV2" }
      );
    } else if (text === "/help") {
      await bot.api.sendMessage(chatId,
        `🎯 *Commands:*\n/signal SYMBOL — Get signal\n/stats — Statistics`,
        { parse_mode: "MarkdownV2" }
      );
    } else if (text.startsWith("/signal ")) {
      const symbol = text.split(" ")[1]?.toUpperCase();
      if (!symbol || !SYMBOLS.includes(symbol)) {
        await bot.api.sendMessage(chatId, `❌ Symbol not supported. Available: ${SYMBOLS.join(", ")}`);
      } else {
        await bot.api.sendMessage(chatId, `🔍 Analyzing *${symbol}*...`, { parse_mode: "Markdown" });
        const signal = generateMockSignal(symbol);
        await bot.api.sendMessage(chatId, formatMessage(signal), { parse_mode: "MarkdownV2" });
      }
    } else if (SYMBOLS.includes(text.toUpperCase())) {
      const symbol = text.toUpperCase();
      await bot.api.sendMessage(chatId, `🔍 Analyzing *${symbol}*...`, { parse_mode: "Markdown" });
      const signal = generateMockSignal(symbol);
      await bot.api.sendMessage(chatId, formatMessage(signal), { parse_mode: "MarkdownV2" });
    } else {
      await bot.api.sendMessage(chatId, `Send me a symbol like XAUUSD or use /signal XAUUSD`);
    }

    return new Response(JSON.stringify({ ok: true }), { status: 200 });
    
  } catch (err: any) {
    console.error("[Webhook] Error:", err.message);
    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  }
}
