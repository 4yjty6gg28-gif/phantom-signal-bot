import {
  fetchMarketData,
  fetchHistoricalData,
  calculateRSI,
  calculateEMA,
  calculateATR,
  calculateSupportResistance,
} from "./market";
import { runAIVoting, type MarketContext } from "./aiVoting";
import {
  runMathAnalysis,
  calculateFibSLTP,
  type MathAnalysisResult,
} from "./mathIndicators";
import { getDb } from "../queries/connection.js";
import { signals, aiVotes } from "../../db/schema.js";

// ─── Types ───
export interface SignalResult {
  id?: number;
  symbol: string;
  direction: "BUY" | "SELL" | "NEUTRAL";
  confidence: number;
  entryPrice: number;
  stopLoss: number;
  takeProfit: number;
  riskReward: string;
  reasoning: string;
  timeframe: string;
  votes: {
    model: string;
    direction: string;
    confidence: number;
    reasoning: string;
  }[];
  consensus: string;
  summary: string;
  mathAnalysis?: MathAnalysisResult;
}

// ─── Generate Complete Signal ───
export async function generateSignal(
  symbol: string,
  timeframe: string = "M15",
  telegramChatId?: string
): Promise<SignalResult> {
  // 1. Fetch market data
  const marketData = await fetchMarketData(symbol);

  // 2. Fetch historical data for indicators
  const historical = await fetchHistoricalData(symbol, "1mo", "1h");
  const closes: number[] = historical.map((h: any) => h.close);
  const highs: number[] = historical.map((h: any) => h.high);
  const lows: number[] = historical.map((h: any) => h.low);

  // 3. Calculate technical indicators
  const rsi = calculateRSI(closes, 14);
  const ema20 = calculateEMA(closes, 20);
  const ema50 = calculateEMA(closes, 50);
  const atr = calculateATR(highs, lows, closes, 14);
  const { support, resistance } = calculateSupportResistance(lows, highs, 20);

  // 4. Calculate swing high/low for Fibonacci analysis
  const swingHigh = Math.max(...highs.slice(-30));
  const swingLow = Math.min(...lows.slice(-30));
  const pullback = closes[closes.length - 5] || closes[closes.length - 1];

  // 5. Run CRT × FIBO Mathematical Analysis
  const mathAnalysis = runMathAnalysis(
    marketData.price,
    swingLow,
    swingHigh,
    pullback,
    highs,
    lows,
    closes
  );

  // 6. Build market context (with math data for AI)
  const context: MarketContext = {
    symbol: marketData.symbol,
    price: marketData.price,
    open: marketData.open,
    high: marketData.high,
    low: marketData.low,
    close: marketData.close,
    changePercent: marketData.changePercent,
    rsi,
    ema20,
    ema50,
    support,
    resistance,
    atr,
    timeframe,
    mathAnalysis,
  };

  // 7. Run AI Voting (with math context)
  const votingResult = await runAIVoting(context);

  // 8. Calculate SL/TP using Fibonacci levels (enhanced)
  const { stopLoss, takeProfit, riskReward, basedOn } = calculateFibSLTP(
    marketData.price,
    votingResult.finalDirection,
    swingLow,
    swingHigh,
    atr,
    symbol
  );

  // 9. Blend AI confidence with Math confidence
  // Formula: AI weight 70% + Math weight 30%
  const blendedConfidence = Math.round(
    votingResult.confidence * 0.7 + mathAnalysis.compositeMathScore * 0.3
  );

  // Build enhanced reasoning with math analysis
  const enhancedReasoning = buildEnhancedReasoning(
    votingResult.summary,
    mathAnalysis,
    basedOn
  );

  // 10. Build result
  const result: SignalResult = {
    symbol: marketData.symbol,
    direction: votingResult.finalDirection,
    confidence: Math.min(100, blendedConfidence),
    entryPrice: marketData.price,
    stopLoss,
    takeProfit,
    riskReward,
    reasoning: enhancedReasoning,
    timeframe,
    votes: votingResult.votes,
    consensus: votingResult.consensus,
    summary: enhancedReasoning,
    mathAnalysis,
  };

  // 8. Save to database
  try {
    const db = getDb();
    const [signalRow] = await db
      .insert(signals)
      .values({
        symbol: result.symbol,
        direction: result.direction,
        confidence: result.confidence,
        entryPrice: result.entryPrice.toFixed(5),
        stopLoss: result.stopLoss.toFixed(5),
        takeProfit: result.takeProfit.toFixed(5),
        reasoning: result.reasoning,
        riskReward: result.riskReward,
        timeframe: result.timeframe,
        telegramChatId: telegramChatId || null,
      })
      .$returningId();

    result.id = signalRow.id;

    // Save AI votes
    for (const vote of result.votes) {
      await db.insert(aiVotes).values({
        signalId: signalRow.id,
        modelName: vote.model,
        direction: vote.direction as "BUY" | "SELL" | "NEUTRAL",
        confidence: vote.confidence,
        reasoning: vote.reasoning,
      });
    }
  } catch (error) {
    console.error("Error saving signal to database:", error);
  }

  return result;
}

// ─── Build Enhanced Reasoning with Math Analysis ───
function buildEnhancedReasoning(
  aiSummary: string,
  math: MathAnalysisResult,
  sltpBasedOn: string
): string {
  let reasoning = aiSummary;

  // Add Fibonacci context
  if (math.nearestFibSupport || math.nearestFibResistance) {
    const fibParts: string[] = [];
    if (math.nearestFibSupport) {
      fibParts.push(
        `Fibonacci support at ${math.nearestFibSupport.label} (${math.nearestFibSupport.price.toFixed(2)})`
      );
    }
    if (math.nearestFibResistance) {
      fibParts.push(
        `Fibonacci resistance at ${math.nearestFibResistance.label} (${math.nearestFibResistance.price.toFixed(2)})`
      );
    }
    reasoning += `\nFibonacci analysis: ${fibParts.join(" | ")}.`;
  }

  // Add Golden Ratio context
  if (math.goldenRatioProximity > 50) {
    reasoning += `\nGolden Ratio proximity: ${math.goldenRatioProximity}% — price is near key phi-based harmonic zone.`;
  }

  // Add CRT/Prime congruence
  if (math.crtCongruenceScore > 30) {
    reasoning += `\nCRT Prime Congruence Score: ${math.crtCongruenceScore}/100 — strong mathematical synchronization at current price level.`;
  }

  // Add harmonic patterns
  if (math.detectedPatterns.length > 0) {
    const patterns = math.detectedPatterns
      .map(
        (p) =>
          `${p.name} (${p.direction}, ${p.completion}% completion, D-point: ${p.dPoint.toFixed(2)})`
      )
      .join("; ");
    reasoning += `\nHarmonic patterns detected: ${patterns}.`;
  }

  // Add SL/TP basis
  reasoning += `\nSL/TP calculated based on: ${sltpBasedOn}.`;

  // Add composite math score
  reasoning += `\nComposite Math Score: ${math.compositeMathScore}/100 | Math Direction: ${math.mathDirection} | Confidence Boost: +${Math.round(math.compositeMathScore * 0.3)}% from mathematical analysis.`;

  return reasoning;
}

// ─── Format Signal for Telegram ───
export function formatSignalMessage(signal: SignalResult): string {
  const directionEmoji =
    signal.direction === "BUY"
      ? "🟢"
      : signal.direction === "SELL"
        ? "🔴"
        : "⚪";

  const confidenceBar = generateConfidenceBar(signal.confidence);

  const prec = signal.entryPrice > 1000 ? 2 : 5;
  const entryStr = signal.entryPrice.toFixed(prec);
  const slStr = signal.stopLoss.toFixed(prec);
  const tpStr = signal.takeProfit.toFixed(prec);

  let message = `
${directionEmoji} *PHANTOM SIGNAL* ${directionEmoji}

*${signal.symbol}* — ${signal.direction}
📊 Confidence: *${signal.confidence}%* ${confidenceBar}
🗳️ Consensus: ${signal.consensus}

💰 *Entry*: ${entryStr}
⛔ *Stop Loss*: ${slStr}
✅ *Take Profit*: ${tpStr}
📈 *Risk:Reward*: ${signal.riskReward}
⏱️ *Timeframe*: ${signal.timeframe}

🧠 *AI VOTING RESULTS:*
`;

  for (const vote of signal.votes) {
    const voteEmoji =
      vote.direction === "BUY" ? "🟢" : vote.direction === "SELL" ? "🔴" : "⚪";
    message += `${voteEmoji} *${vote.model}*: ${vote.direction} (${vote.confidence}%)\n`;
  }

  // Add CRT x FIBO Math Analysis section
  if (signal.mathAnalysis) {
    const m = signal.mathAnalysis;
    message += `
🔮 *CRT x FIBO MATHEMATICAL ENGINE:*
`;

    // Fibonacci Retracement
    if (m.nearestFibSupport || m.nearestFibResistance) {
      message += `📐 *Fibonacci Levels:*\n`;
      if (m.nearestFibSupport) {
        message += `  S: ${m.nearestFibSupport.label} @ ${m.nearestFibSupport.price.toFixed(prec)}\n`;
      }
      if (m.nearestFibResistance) {
        message += `  R: ${m.nearestFibResistance.label} @ ${m.nearestFibResistance.price.toFixed(prec)}\n`;
      }
    }

    // Golden Ratio
    message += `🌟 *Golden Ratio Proximity:* ${m.goldenRatioProximity}%\n`;
    message += `🎯 *Phi Confluence Score:* ${m.phiConfluence}/100\n`;

    // CRT/Prime
    message += `🔢 *CRT Prime Congruence:* ${m.crtCongruenceScore}/100\n`;

    // Harmonic Patterns
    if (m.detectedPatterns.length > 0) {
      message += `〰️ *Harmonic Patterns:*\n`;
      for (const p of m.detectedPatterns.slice(0, 2)) {
        const patEmoji = p.direction === "BULLISH" ? "🐂" : "🐻";
        message += `  ${patEmoji} ${p.name}: ${p.completion}% completion\n`;
      }
    }

    // Composite Score
    message += `
📊 *Composite Math Score:* ${m.compositeMathScore}/100\n`;
    message += `📈 *Math Direction:* ${m.mathDirection}\n`;
  }

  message += `
📝 *Analysis:*
${signal.reasoning}

⚠️ *Disclaimer:* This is an AI\-generated analysis for educational purposes only\. Always do your own research before trading\. Risk management is essential\.
`;

  return message;
}

function generateConfidenceBar(confidence: number): string {
  const filled = Math.round(confidence / 10);
  const empty = 10 - filled;
  return "▰".repeat(filled) + "▱".repeat(empty);
}

// ─── Get Signal History ───
export async function getSignalHistory(limit: number = 50) {
  const db = getDb();
  return db.query.signals.findMany({
    orderBy: (signals, { desc }) => [desc(signals.createdAt)],
    limit,
    with: {
      aiVotes: true,
    },
  });
}

// ─── Get Signal Stats ───
export async function getSignalStats() {
  const db = getDb();
  const allSignals = await db.query.signals.findMany({
    orderBy: (signals, { desc }) => [desc(signals.createdAt)],
    limit: 100,
  });

  const total = allSignals.length;
  const buyCount = allSignals.filter((s) => s.direction === "BUY").length;
  const sellCount = allSignals.filter((s) => s.direction === "SELL").length;
  const neutralCount = allSignals.filter(
    (s) => s.direction === "NEUTRAL"
  ).length;
  const avgConfidence =
    total > 0
      ? allSignals.reduce((sum, s) => sum + s.confidence, 0) / total
      : 0;

  return {
    total,
    buyCount,
    sellCount,
    neutralCount,
    avgConfidence: Math.round(avgConfidence),
    recentSignals: allSignals.slice(0, 10),
  };
}
