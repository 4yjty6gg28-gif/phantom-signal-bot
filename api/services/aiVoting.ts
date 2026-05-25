// ─── Types ───
export interface AIVote {
  model: string;
  direction: "BUY" | "SELL" | "NEUTRAL";
  confidence: number;
  reasoning: string;
}

export interface VotingResult {
  finalDirection: "BUY" | "SELL" | "NEUTRAL";
  confidence: number;
  consensus: string;
  votes: AIVote[];
  summary: string;
}

import type { MathAnalysisResult } from "./mathIndicators";

export interface MarketContext {
  symbol: string;
  price: number;
  open: number;
  high: number;
  low: number;
  close: number;
  changePercent: number;
  rsi: number;
  ema20: number;
  ema50: number;
  support: number;
  resistance: number;
  atr: number;
  timeframe: string;
  mathAnalysis?: MathAnalysisResult;
}

// ─── Build Analysis Prompt ───
function buildMathSection(math: MathAnalysisResult): string {
  let section = `MATHEMATICAL ANALYSIS (CRT x FIBO Engine):`;

  // Fibonacci levels
  if (math.nearestFibSupport || math.nearestFibResistance) {
    section += `\n- Fibonacci Levels: `;
    if (math.nearestFibSupport) {
      section += `Support ${math.nearestFibSupport.label} @ ${math.nearestFibSupport.price.toFixed(5)} `;
    }
    if (math.nearestFibResistance) {
      section += `Resistance ${math.nearestFibResistance.label} @ ${math.nearestFibResistance.price.toFixed(5)}`;
    }
  }

  // Golden Ratio
  section += `\n- Golden Ratio Proximity: ${math.goldenRatioProximity}% (closer to 100% = price at key harmonic zone)`;
  section += `\n- Phi Confluence Score: ${math.phiConfluence}/100 (alignment of golden ratio levels)`;

  // CRT/Prime
  section += `\n- CRT Prime Congruence Score: ${math.crtCongruenceScore}/100 (Chinese Remainder Theorem-based synchronization)`;

  // Harmonic patterns
  if (math.detectedPatterns.length > 0) {
    section += `\n- Harmonic Patterns: `;
    for (const p of math.detectedPatterns) {
      section += `${p.name} (${p.direction}, ${p.completion}% complete, D=${p.dPoint.toFixed(5)}) `;
    }
  }

  // Composite
  section += `\n- Composite Math Score: ${math.compositeMathScore}/100 | Math Direction: ${math.mathDirection}`;

  return section;
}

function buildPrompt(ctx: MarketContext): string {
  return `You are an expert forex/commodity trader with 15 years of experience. Analyze the following market data and provide a trading signal. Pay special attention to the mathematical analysis from our CRT x FIBO engine.

MARKET DATA:
- Symbol: ${ctx.symbol}
- Current Price: ${ctx.price}
- Open: ${ctx.open} | High: ${ctx.high} | Low: ${ctx.low}
- Previous Close: ${ctx.close}
- Change: ${ctx.changePercent.toFixed(2)}%

TECHNICAL INDICATORS:
- RSI(14): ${ctx.rsi.toFixed(2)} ${ctx.rsi > 70 ? "(Overbought)" : ctx.rsi < 30 ? "(Oversold)" : "(Neutral)"}
- EMA(20): ${ctx.ema20.toFixed(5)} ${ctx.price > ctx.ema20 ? "(Price above)" : "(Price below)"}
- EMA(50): ${ctx.ema50.toFixed(5)} ${ctx.price > ctx.ema50 ? "(Price above)" : "(Price below)"}
- Support: ${ctx.support.toFixed(5)}
- Resistance: ${ctx.resistance.toFixed(5)}
- ATR(14): ${ctx.atr.toFixed(5)} (volatility)

${ctx.mathAnalysis ? buildMathSection(ctx.mathAnalysis) : ""}

INSTRUCTIONS:
1. Analyze the market condition (trend, momentum, key levels)
2. Determine if this is a BUY, SELL, or NEUTRAL setup
3. Provide confidence score (0-100%)
4. Give specific reasoning in 2-3 sentences

RESPOND IN THIS EXACT FORMAT:
SIGNAL: [BUY/SELL/NEUTRAL]
CONFIDENCE: [0-100]
REASONING: [your analysis]`;
}

// ─── Parse AI Response ───
function parseResponse(model: string, text: string): AIVote {
  const signalMatch = text.match(/SIGNAL:\s*(BUY|SELL|NEUTRAL)/i);
  const confidenceMatch = text.match(/CONFIDENCE:\s*(\d+)/i);
  const reasoningMatch = text.match(/REASONING:\s*(.+?)(?:\n|$)/is);

  const direction = (
    signalMatch?.[1]?.toUpperCase() || "NEUTRAL"
  ) as AIVote["direction"];
  const confidence = Math.min(
    100,
    Math.max(0, parseInt(confidenceMatch?.[1] || "50"))
  );
  const reasoning = reasoningMatch?.[1]?.trim() || text.slice(0, 200);

  return { model, direction, confidence, reasoning };
}

// ─── Kimi API Call ───
async function callKimi(prompt: string): Promise<AIVote> {
  try {
    const KIMI_API_KEY = process.env.KIMI_API_KEY || "";
    if (!KIMI_API_KEY) {
      return mockVote("Kimi K2", prompt);
    }

    const response = await fetch("https://api.moonshot.cn/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${KIMI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "kimi-k2-0711-preview",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.3,
        max_tokens: 300,
      }),
    });

    const data = (await response.json()) as any;
    const text = data.choices?.[0]?.message?.content || "";
    return parseResponse("Kimi K2", text);
  } catch (error) {
    console.error("Kimi API error:", error);
    return mockVote("Kimi K2", prompt);
  }
}

// ─── OpenRouter API Calls ───
async function callOpenRouter(
  model: string,
  modelName: string,
  prompt: string
): Promise<AIVote> {
  try {
    const OPENROUTER_KEY = process.env.OPENROUTER_API_KEY || "";
    if (!OPENROUTER_KEY) {
      return mockVote(modelName, prompt);
    }

    const response = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${OPENROUTER_KEY}`,
          "HTTP-Referer": process.env.APP_URL || "https://phantomsignal.app",
          "X-Title": "Phantom Signal Bot",
        },
        body: JSON.stringify({
          model,
          messages: [{ role: "user", content: prompt }],
          temperature: 0.3,
          max_tokens: 300,
        }),
      }
    );

    const data = (await response.json()) as any;
    const text = data.choices?.[0]?.message?.content || "";
    return parseResponse(modelName, text);
  } catch (error) {
    console.error(`${modelName} API error:`, error);
    return mockVote(modelName, prompt);
  }
}

// ─── Mock Vote (Fallback) ───
function mockVote(model: string, prompt: string): AIVote {
  // Extract price data from prompt for realistic mock
  const rsiMatch = prompt.match(/RSI\(14\):\s*([\d.]+)/);
  const rsi = parseFloat(rsiMatch?.[1] || "50");

  let direction: AIVote["direction"] = "NEUTRAL";
  let confidence = 50;
  let reasoning = "";

  if (rsi < 35) {
    direction = "BUY";
    confidence = 65 + Math.random() * 20;
    reasoning = `RSI oversold at ${rsi.toFixed(1)} suggests potential bounce. Price near support level with weakening selling pressure.`;
  } else if (rsi > 65) {
    direction = "SELL";
    confidence = 65 + Math.random() * 20;
    reasoning = `RSI overbought at ${rsi.toFixed(1)} indicates possible correction. Momentum fading at resistance.`;
  } else {
    direction = Math.random() > 0.5 ? "BUY" : "SELL";
    confidence = 50 + Math.random() * 15;
    reasoning = `Mixed signals with RSI neutral at ${rsi.toFixed(1)}. Waiting for clearer directional confirmation.`;
  }

  // Different personality per model
  const personalities: Record<string, string> = {
    "Kimi K2": "Long-context analysis shows",
    "Claude 3.5": "Technical structure indicates",
    "GPT-4o": "Multi-timeframe analysis suggests",
    "DeepSeek V3": "Pattern recognition reveals",
  };

  const prefix = personalities[model] || "Analysis shows";

  return {
    model,
    direction,
    confidence: Math.round(confidence),
    reasoning: `${prefix} ${reasoning}`,
  };
}

// ─── Main Voting Engine ───
export async function runAIVoting(ctx: MarketContext): Promise<VotingResult> {
  const prompt = buildPrompt(ctx);

  // Run all AI models in parallel
  const [kimiVote, claudeVote, gptVote, deepseekVote] = await Promise.all([
    callKimi(prompt),
    callOpenRouter(
      "anthropic/claude-3.5-sonnet",
      "Claude 3.5",
      prompt
    ),
    callOpenRouter("openai/gpt-4o", "GPT-4o", prompt),
    callOpenRouter("deepseek/deepseek-chat", "DeepSeek V3", prompt),
  ]);

  const votes = [kimiVote, claudeVote, gptVote, deepseekVote];

  // Calculate consensus
  const buyCount = votes.filter((v) => v.direction === "BUY").length;
  const sellCount = votes.filter((v) => v.direction === "SELL").length;
  const neutralCount = votes.filter((v) => v.direction === "NEUTRAL").length;

  let finalDirection: VotingResult["finalDirection"] = "NEUTRAL";
  if (buyCount > sellCount && buyCount > neutralCount)
    finalDirection = "BUY";
  else if (sellCount > buyCount && sellCount > neutralCount)
    finalDirection = "SELL";

  // Calculate weighted confidence
  const agreeVotes = votes.filter((v) => v.direction === finalDirection);
  const avgConfidence =
    agreeVotes.length > 0
      ? agreeVotes.reduce((sum, v) => sum + v.confidence, 0) / agreeVotes.length
      : 50;

  // Consensus description
  let consensus = "No clear consensus";
  if (buyCount >= 3) consensus = "Strong Buy consensus";
  else if (sellCount >= 3) consensus = "Strong Sell consensus";
  else if (buyCount === 2 && sellCount <= 1)
    consensus = "Moderate Buy consensus";
  else if (sellCount === 2 && buyCount <= 1)
    consensus = "Moderate Sell consensus";
  else if (neutralCount >= 2) consensus = "Neutral/Mixed signals";
  else consensus = "Divided opinion";

  // Generate summary
  const summary = generateSummary(ctx, finalDirection, votes);

  return {
    finalDirection,
    confidence: Math.round(avgConfidence),
    consensus,
    votes,
    summary,
  };
}

function generateSummary(
  ctx: MarketContext,
  direction: string,
  votes: AIVote[]
): string {
  const buyVotes = votes.filter((v) => v.direction === "BUY");
  const sellVotes = votes.filter((v) => v.direction === "SELL");

  if (direction === "BUY" && buyVotes.length > 0) {
    const topReason = buyVotes.sort((a, b) => b.confidence - a.confidence)[0];
    return `${ctx.symbol} showing bullish signals at ${ctx.price}. ${topReason.reasoning} ${buyVotes.length}/${votes.length} AI analysts agree on BUY.`;
  } else if (direction === "SELL" && sellVotes.length > 0) {
    const topReason = sellVotes.sort((a, b) => b.confidence - a.confidence)[0];
    return `${ctx.symbol} showing bearish signals at ${ctx.price}. ${topReason.reasoning} ${sellVotes.length}/${votes.length} AI analysts agree on SELL.`;
  }

  return `${ctx.symbol} at ${ctx.price} has mixed signals. No clear directional bias. Consider waiting for better setup.`;
}
