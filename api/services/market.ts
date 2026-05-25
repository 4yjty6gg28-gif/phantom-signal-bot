import yahooFinance from "yahoo-finance2";

// Map common forex/gold symbols to Yahoo Finance tickers
const SYMBOL_MAP: Record<string, string> = {
  XAUUSD: "GC=F", // Gold Futures
  EURUSD: "EURUSD=X",
  GBPUSD: "GBPUSD=X",
  USDJPY: "USDJPY=X",
  AUDUSD: "AUDUSD=X",
  USDCAD: "USDCAD=X",
  USDCHF: "USDCHF=X",
  NZDUSD: "NZDUSD=X",
  GBPJPY: "GBPJPY=X",
  BTCUSD: "BTC-USD",
  ETHUSD: "ETH-USD",
  OIL: "CL=F", // Crude Oil
};

export interface MarketData {
  symbol: string;
  price: number;
  open: number;
  high: number;
  low: number;
  close: number;
  previousClose: number;
  change: number;
  changePercent: number;
  volume: number;
  fiftyTwoWeekHigh: number;
  fiftyTwoWeekLow: number;
  fiftyDayAverage: number;
  twoHundredDayAverage: number;
  timestamp: Date;
}

export async function fetchMarketData(symbol: string): Promise<MarketData> {
  const ticker = SYMBOL_MAP[symbol.toUpperCase()] || symbol.toUpperCase();

  try {
    const quote = await yahooFinance.quote(ticker);
    const result = (quote as any[])[0];

    if (!result) {
      throw new Error(`No data found for ${symbol}`);
    }

    return {
      symbol: symbol.toUpperCase(),
      price: result.regularMarketPrice || 0,
      open: result.regularMarketOpen || 0,
      high: result.regularMarketDayHigh || 0,
      low: result.regularMarketDayLow || 0,
      close: result.regularMarketPreviousClose || 0,
      previousClose: result.regularMarketPreviousClose || 0,
      change: result.regularMarketChange || 0,
      changePercent: result.regularMarketChangePercent || 0,
      volume: result.regularMarketVolume || 0,
      fiftyTwoWeekHigh: result.fiftyTwoWeekHigh || 0,
      fiftyTwoWeekLow: result.fiftyTwoWeekLow || 0,
      fiftyDayAverage: result.fiftyDayAverage || 0,
      twoHundredDayAverage: result.twoHundredDayAverage || 0,
      timestamp: new Date(),
    };
  } catch (error) {
    console.error(`Error fetching market data for ${symbol}:`, error);
    throw new Error(`Failed to fetch data for ${symbol}. Try: XAUUSD, EURUSD, GBPUSD, USDJPY, BTCUSD`);
  }
}

export async function fetchHistoricalData(
  symbol: string,
  period: string = "1mo",
  interval: string = "1h"
) {
  const ticker = SYMBOL_MAP[symbol.toUpperCase()] || symbol.toUpperCase();

  try {
    const result = (await yahooFinance.chart(ticker, {
      period1: getPeriodStart(period),
      interval: interval as any,
    })) as any;

    return (result.quotes || []).map((q: any) => ({
      date: q.date,
      open: q.open || 0,
      high: q.high || 0,
      low: q.low || 0,
      close: q.close || 0,
      volume: q.volume || 0,
    }));
  } catch (error) {
    console.error(`Error fetching historical data:`, error);
    return [];
  }
}

function getPeriodStart(period: string): Date {
  const now = new Date();
  switch (period) {
    case "1d":
      return new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000);
    case "5d":
      return new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000);
    case "1mo":
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    case "3mo":
      return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    case "6mo":
      return new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);
    default:
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  }
}

// Technical indicators calculation
export function calculateRSI(closes: number[], period: number = 14): number {
  if (closes.length < period + 1) return 50;

  let gains = 0;
  let losses = 0;

  for (let i = closes.length - period; i < closes.length; i++) {
    const change = closes[i] - closes[i - 1];
    if (change > 0) gains += change;
    else losses += Math.abs(change);
  }

  const avgGain = gains / period;
  const avgLoss = losses / period;

  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return 100 - 100 / (1 + rs);
}

export function calculateEMA(closes: number[], period: number): number {
  if (closes.length < period) return closes[closes.length - 1];

  const multiplier = 2 / (period + 1);
  let ema = closes.slice(0, period).reduce((a, b) => a + b, 0) / period;

  for (let i = period; i < closes.length; i++) {
    ema = (closes[i] - ema) * multiplier + ema;
  }

  return ema;
}

export function calculateATR(
  highs: number[],
  lows: number[],
  closes: number[],
  period: number = 14
): number {
  if (highs.length < period + 1) return 0;

  let atr = 0;
  for (let i = highs.length - period; i < highs.length; i++) {
    const tr1 = highs[i] - lows[i];
    const tr2 = Math.abs(highs[i] - closes[i - 1]);
    const tr3 = Math.abs(lows[i] - closes[i - 1]);
    atr += Math.max(tr1, tr2, tr3);
  }

  return atr / period;
}

export function calculateSupportResistance(
  lows: number[],
  highs: number[],
  lookback: number = 20
): { support: number; resistance: number } {
  const recentLows = lows.slice(-lookback);
  const recentHighs = highs.slice(-lookback);

  return {
    support: Math.min(...recentLows),
    resistance: Math.max(...recentHighs),
  };
}