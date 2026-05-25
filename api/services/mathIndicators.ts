// ══════════════════════════════════════════════════════════════
//  CRT × FIBO Mathematical Engine
//  Fibonacci analysis + Chinese Remainder Theorem inspired
//  prime-congruence support/resistance calculation
// ══════════════════════════════════════════════════════════════

// ─── Golden Ratio Constants ───
const PHI = 1.618033988749895; // Golden Ratio
const PHI_INV = 0.618033988749895; // 1/Phi
const PHI_SQR = 2.618033988749895; // Phi^2
const SQRT_PHI = 1.272019649514069; // sqrt(Phi)

// ─── Fibonacci Retracement Levels ───
const FIB_RETRACEMENT = [0, 0.236, 0.382, 0.5, 0.618, 0.786, 1];

// ─── Fibonacci Extension Levels ───
const FIB_EXTENSION = [1.272, 1.618, 2, 2.618, 3.618, 4.236];

// ─── Prime numbers for CRT analysis ───
const PRIMES = [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47];

// ─── Types ───
export interface FibLevel {
  ratio: number;
  price: number;
  label: string;
  distance: number; // distance from current price
}

export interface MathAnalysisResult {
  // Fibonacci
  fibRetracement: FibLevel[];
  fibExtensions: FibLevel[];
  nearestFibSupport: FibLevel | null;
  nearestFibResistance: FibLevel | null;

  // Golden Ratio
  goldenRatioProximity: number; // 0-100, how close price is to golden zone
  phiConfluence: number; // 0-100, confluence of phi-based levels

  // CRT / Prime Analysis
  primeSupportLevels: number[];
  primeResistanceLevels: number[];
  crtCongruenceScore: number; // 0-100

  // Fibonacci Time
  fibTimeZones: number[]; // future bar counts

  // Harmonic Patterns
  detectedPatterns: HarmonicPattern[];

  // Composite
  compositeMathScore: number; // 0-100
  mathConfidence: number; // 0-100
  mathDirection: "BUY" | "SELL" | "NEUTRAL";
}

export interface HarmonicPattern {
  name: string;
  direction: "BULLISH" | "BEARISH";
  completion: number; // 0-100
  dPoint: number; // potential reversal price
}

// ══════════════════════════════════════════════════════════════
//  CORE CALCULATIONS
// ══════════════════════════════════════════════════════════════

/**
 * Calculate Fibonacci Retracement levels from swing high/low
 */
export function calculateFibRetracement(
  swingLow: number,
  swingHigh: number,
  currentPrice: number
): FibLevel[] {
  const range = swingHigh - swingLow;

  return FIB_RETRACEMENT.map((ratio) => {
    const price = swingHigh - range * ratio;
    return {
      ratio,
      price: Math.round(price * 100000) / 100000,
      label: getFibLabel(ratio),
      distance: Math.abs(currentPrice - price),
    };
  }).sort((a, b) => b.price - a.price);
}

/**
 * Calculate Fibonacci Extension levels beyond swing
 */
export function calculateFibExtensions(
  swingLow: number,
  swingHigh: number,
  pullback: number, // retracement point
  currentPrice: number
): FibLevel[] {
  const range = swingHigh - swingLow;

  return FIB_EXTENSION.map((ext) => {
    const price = pullback + range * ext;
    return {
      ratio: ext,
      price: Math.round(price * 100000) / 100000,
      label: getFibLabel(ext),
      distance: Math.abs(currentPrice - price),
    };
  }).sort((a, b) => a.price - b.price);
}

/**
 * Chinese Remainder Theorem inspired prime congruence analysis.
 * Uses prime moduli to find hidden support/resistance levels
 * where price "synchronizes" across multiple prime bases.
 */
export function calculateCRTLevels(
  currentPrice: number,
  pivotHigh: number,
  pivotLow: number
): {
  supportLevels: number[];
  resistanceLevels: number[];
  congruenceScore: number;
} {
  const price = Math.round(currentPrice * 10000); // work in micro-pips
  const high = Math.round(pivotHigh * 10000);
  const low = Math.round(pivotLow * 10000);
  const range = high - low;

  // Find CRT congruence points — price levels that satisfy
  // multiple prime remainder conditions simultaneously
  const supportLevels: number[] = [];
  const resistanceLevels: number[] = [];
  let congruencePoints = 0;

  // Use first 5 primes for CRT analysis
  const crtPrimes = PRIMES.slice(0, 5); // [2, 3, 5, 7, 11]

  // Calculate remainders of current price against primes
  const currentRemainders = crtPrimes.map((p) => price % p);

  // Look for nearby levels where price has "harmonic" congruence
  // (similar remainders = price is "in tune" with that level)
  const searchRange = Math.min(range, 10000); // 1 pip in micro-pips

  for (let offset = -searchRange; offset <= searchRange; offset += 50) {
    const testPrice = price + offset;
    const testRemainders = crtPrimes.map((p) => testPrice % p);

    // Count how many remainders match (congruence count)
    let matches = 0;
    for (let i = 0; i < crtPrimes.length; i++) {
      // Remainders are "close enough" if within 1 of each other
      const diff = Math.abs(
        ((testRemainders[i] - currentRemainders[i] + crtPrimes[i]) %
          crtPrimes[i])
      );
      if (diff <= 1) matches++;
    }

    if (matches >= 3) {
      // Strong congruence found
      const level = testPrice / 10000;
      congruencePoints++;

      if (level < currentPrice) {
        supportLevels.push(level);
      } else if (level > currentPrice) {
        resistanceLevels.push(level);
      }
    }
  }

  // Remove duplicates and sort
  const uniqueSupport = [...new Set(supportLevels.map((s) => Math.round(s * 100) / 100))].sort(
    (a, b) => b - a
  );
  const uniqueResistance = [...new Set(resistanceLevels.map((r) => Math.round(r * 100) / 100))].sort(
    (a, b) => a - b
  );

  // Congruence score: higher = more prime harmony at current price
  const congruenceScore = Math.min(100, Math.round((congruencePoints / 50) * 100));

  return {
    supportLevels: uniqueSupport.slice(0, 3), // top 3
    resistanceLevels: uniqueResistance.slice(0, 3), // top 3
    congruenceScore,
  };
}

/**
 * Golden Ratio proximity — how close is current price to key phi levels
 */
export function calculateGoldenRatioProximity(
  currentPrice: number,
  swingLow: number,
  swingHigh: number
): { proximity: number; phiLevels: number[] } {
  const range = swingHigh - swingLow;

  // Key phi-based levels
  const phiLevels = [
    swingLow + range * PHI_INV, // 61.8% retracement
    swingLow + range * 0.5, // 50%
    swingLow + range * (1 - PHI_INV), // 38.2%
    swingLow + range / PHI, // alternative phi
    swingLow + range * (1 / PHI_SQR), // 23.6%
    swingHigh + range * 0.272, // 27.2% extension
    swingHigh + range * (PHI - 1), // 61.8% extension
    swingHigh + range * (SQRT_PHI - 1), // 27.2% extension
  ].map((p) => Math.round(p * 100000) / 100000);

  // Find minimum distance to any phi level
  let minDistance = Infinity;
  for (const level of phiLevels) {
    const dist = Math.abs(currentPrice - level) / range;
    if (dist < minDistance) minDistance = dist;
  }

  // Convert to proximity score (closer = higher score)
  const proximity = Math.max(0, Math.round((1 - minDistance) * 100));

  return { proximity, phiLevels };
}

/**
 * Calculate Fibonacci Time Zones from a significant pivot
 */
export function calculateFibTimeZones(
  pivotBarIndex: number,
  currentBarIndex: number
): number[] {
  const fibSequence = [1, 2, 3, 5, 8, 13, 21, 34, 55, 89, 144];
  const futureZones: number[] = [];

  for (const fib of fibSequence) {
    const zone = pivotBarIndex + fib;
    if (zone > currentBarIndex) {
      futureZones.push(zone - currentBarIndex); // bars ahead
    }
  }

  return futureZones.slice(0, 5); // next 5 zones
}

/**
 * Basic Harmonic Pattern Detection
 */
export function detectHarmonicPatterns(
  highs: number[],
  lows: number[],
  closes: number[]
): HarmonicPattern[] {
  const patterns: HarmonicPattern[] = [];

  if (highs.length < 10 || lows.length < 10) return patterns;

  // Find last 4 significant points (X, A, B, C)
  const X = { price: Math.min(...lows.slice(-15, -10)), idx: 0 };
  const A = { price: Math.max(...highs.slice(-12, -7)), idx: 3 };
  const B = { price: Math.min(...lows.slice(-8, -4)), idx: 6 };
  const C = { price: Math.max(...highs.slice(-5, -2)), idx: 9 };

  // Check ABCD pattern (most common)
  if (X.price && A.price && B.price && C.price) {
    const XA = A.price - X.price;
    const AB = A.price - B.price;
    const BC = C.price - B.price;

    // AB should be ~61.8% of XA
    const abRatio = AB / XA;

    if (Math.abs(abRatio - 0.618) < 0.15) {
      // Potential ABCD bullish
      const CD = BC * 1.272; // minimum extension
      const D = B.price - CD;
      const completion = calculateCompletion(C.price, D, closes[closes.length - 1]);

      patterns.push({
        name: "AB=CD Bullish",
        direction: "BULLISH",
        completion,
        dPoint: Math.round(D * 100000) / 100000,
      });
    }

    if (Math.abs(abRatio - 0.786) < 0.15) {
      // Potential Gartley
      const dPoint = A.price - XA * 0.786;
      const completion = calculateCompletion(C.price, dPoint, closes[closes.length - 1]);

      patterns.push({
        name: "Gartley Bullish",
        direction: "BULLISH",
        completion,
        dPoint: Math.round(dPoint * 100000) / 100000,
      });
    }
  }

  // Check for bearish variants
  const X_high = { price: Math.max(...highs.slice(-15, -10)), idx: 0 };
  const A_low = { price: Math.min(...lows.slice(-12, -7)), idx: 3 };
  const B_high = { price: Math.max(...highs.slice(-8, -4)), idx: 6 };
  const C_low = { price: Math.min(...lows.slice(-5, -2)), idx: 9 };

  if (X_high.price && A_low.price && B_high.price && C_low.price) {
    const XA = X_high.price - A_low.price;
    const AB = B_high.price - A_low.price;
    const BC = B_high.price - C_low.price;

    const abRatio = AB / XA;

    if (Math.abs(abRatio - 0.618) < 0.15) {
      const CD = BC * 1.272;
      const D = B_high.price + CD;
      const completion = calculateCompletion(C_low.price, D, closes[closes.length - 1]);

      patterns.push({
        name: "AB=CD Bearish",
        direction: "BEARISH",
        completion,
        dPoint: Math.round(D * 100000) / 100000,
      });
    }
  }

  return patterns;
}

function calculateCompletion(C: number, D: number, current: number): number {
  const range = Math.abs(D - C);
  if (range === 0) return 0;
  const progress = Math.abs(current - C) / range;
  return Math.min(100, Math.round(progress * 100));
}

/**
 * Main composite analysis — combines all math indicators
 */
export function runMathAnalysis(
  currentPrice: number,
  swingLow: number,
  swingHigh: number,
  pullback: number,
  highs: number[],
  lows: number[],
  closes: number[]
): MathAnalysisResult {
  // 1. Fibonacci Retracement
  const fibRetracement = calculateFibRetracement(
    swingLow,
    swingHigh,
    currentPrice
  );

  // 2. Fibonacci Extensions
  const fibExtensions = calculateFibExtensions(
    swingLow,
    swingHigh,
    pullback,
    currentPrice
  );

  // Find nearest fib support/resistance
  const fibsBelow = fibRetracement.filter((f) => f.price < currentPrice);
  const fibsAbove = fibRetracement.filter((f) => f.price > currentPrice);
  const nearestFibSupport =
    fibsBelow.length > 0
      ? fibsBelow.reduce((a, b) => (a.distance < b.distance ? a : b))
      : null;
  const nearestFibResistance =
    fibsAbove.length > 0
      ? fibsAbove.reduce((a, b) => (a.distance < b.distance ? a : b))
      : null;

  // 3. Golden Ratio
  const { proximity: goldenRatioProximity, phiLevels } =
    calculateGoldenRatioProximity(currentPrice, swingLow, swingHigh);

  // Calculate phi confluence (how many phi levels are nearby)
  let phiConfluence = 0;
  const range = swingHigh - swingLow;
  for (const level of phiLevels) {
    const dist = Math.abs(currentPrice - level) / range;
    if (dist < 0.05) phiConfluence += 25; // within 5%
    else if (dist < 0.1) phiConfluence += 15; // within 10%
    else if (dist < 0.15) phiConfluence += 5;
  }
  phiConfluence = Math.min(100, phiConfluence);

  // 4. CRT Analysis
  const {
    supportLevels: primeSupportLevels,
    resistanceLevels: primeResistanceLevels,
    congruenceScore: crtCongruenceScore,
  } = calculateCRTLevels(currentPrice, swingHigh, swingLow);

  // 5. Fibonacci Time
  const fibTimeZones = calculateFibTimeZones(0, highs.length);

  // 6. Harmonic Patterns
  const detectedPatterns = detectHarmonicPatterns(highs, lows, closes);

  // 7. Composite Math Score
  // Weight the components
  const fibWeight = 0.25;
  const phiWeight = 0.25;
  const crtWeight = 0.2;
  const patternWeight = 0.15;
  const confluenceWeight = 0.15;

  const fibScore = calculateFibScore(
    currentPrice,
    fibRetracement,
    nearestFibSupport,
    nearestFibResistance
  );

  const patternScore =
    detectedPatterns.length > 0
      ? Math.max(
          ...detectedPatterns.map((p) =>
            p.direction === "BULLISH" ? p.completion : -p.completion
          )
        )
      : 0;

  // Normalize pattern score to 0-100
  const normalizedPatternScore = Math.abs(patternScore);

  const compositeMathScore = Math.round(
    fibScore * fibWeight +
      goldenRatioProximity * phiWeight +
      crtCongruenceScore * crtWeight +
      normalizedPatternScore * patternWeight +
      phiConfluence * confluenceWeight
  );

  // Math direction
  let mathDirection: MathAnalysisResult["mathDirection"] = "NEUTRAL";

  // Check if price is near golden support (BUY) or golden resistance (SELL)
  const isNearSupport = nearestFibSupport
    ? nearestFibSupport.ratio === 0.618 ||
      nearestFibSupport.ratio === 0.5 ||
      nearestFibSupport.ratio === 0.382
    : false;
  const isNearResistance = nearestFibResistance
    ? nearestFibResistance.ratio === 0.618 ||
      nearestFibResistance.ratio === 0.5 ||
      nearestFibResistance.ratio === 0.382
    : false;

  // Pattern direction
  const bullishPatterns = detectedPatterns.filter(
    (p) => p.direction === "BULLISH" && p.completion > 50
  );
  const bearishPatterns = detectedPatterns.filter(
    (p) => p.direction === "BEARISH" && p.completion > 50
  );

  if (isNearSupport && bullishPatterns.length > bearishPatterns.length) {
    mathDirection = "BUY";
  } else if (
    isNearResistance &&
    bearishPatterns.length > bullishPatterns.length
  ) {
    mathDirection = "SELL";
  } else if (
    bullishPatterns.length > 0 &&
    bullishPatterns.length > bearishPatterns.length
  ) {
    mathDirection = "BUY";
  } else if (
    bearishPatterns.length > 0 &&
    bearishPatterns.length > bullishPatterns.length
  ) {
    mathDirection = "SELL";
  }

  // Math confidence
  const mathConfidence = Math.min(100, compositeMathScore + 10);

  return {
    fibRetracement,
    fibExtensions,
    nearestFibSupport,
    nearestFibResistance,
    goldenRatioProximity,
    phiConfluence,
    primeSupportLevels,
    primeResistanceLevels,
    crtCongruenceScore,
    fibTimeZones,
    detectedPatterns,
    compositeMathScore: Math.min(100, compositeMathScore),
    mathConfidence: Math.min(100, mathConfidence),
    mathDirection,
  };
}

/**
 * Calculate Fibonacci-based score for current price position
 */
function calculateFibScore(
  currentPrice: number,
  fibLevels: FibLevel[],
  nearestSupport: FibLevel | null,
  nearestResistance: FibLevel | null
): number {
  let score = 50; // neutral base

  // Score based on which fib level we're near
  if (nearestSupport) {
    const ratio = nearestSupport.ratio;
    if (ratio === 0.618) score += 20; // golden retracement support
    else if (ratio === 0.5) score += 15; // half-way support
    else if (ratio === 0.382) score += 10;
    else if (ratio === 0.786) score += 5;
  }

  if (nearestResistance) {
    const ratio = nearestResistance.ratio;
    if (ratio === 0.618) score -= 20; // golden retracement resistance
    else if (ratio === 0.5) score -= 15;
    else if (ratio === 0.382) score -= 10;
    else if (ratio === 0.786) score -= 5;
  }

  // Check if price is in "golden zone" (between 38.2% and 61.8%)
  const goldenZoneLow = fibLevels.find((f) => f.ratio === 0.618);
  const goldenZoneHigh = fibLevels.find((f) => f.ratio === 0.382);
  if (
    goldenZoneLow &&
    goldenZoneHigh &&
    currentPrice >= goldenZoneLow.price &&
    currentPrice <= goldenZoneHigh.price
  ) {
    score += 10; // bonus for being in golden zone
  }

  return Math.max(0, Math.min(100, score));
}

function getFibLabel(ratio: number): string {
  const labels: Record<number, string> = {
    0: "0%",
    0.236: "23.6%",
    0.382: "38.2%",
    0.5: "50%",
    0.618: "61.8% (Phi)",
    0.786: "78.6%",
    1: "100%",
    1.272: "127.2% (sqrt Phi)",
    1.618: "161.8% (Phi)",
    2: "200%",
    2.618: "261.8% (Phi^2)",
    3.618: "361.8%",
    4.236: "423.6%",
  };

  return labels[ratio] || `${(ratio * 100).toFixed(1)}%`;
}

/**
 * Generate SL and TP based on Fibonacci levels
 */
export function calculateFibSLTP(
  currentPrice: number,
  direction: "BUY" | "SELL" | "NEUTRAL",
  swingLow: number,
  swingHigh: number,
  atr: number,
  symbol: string
): { stopLoss: number; takeProfit: number; riskReward: string; basedOn: string } {
  const fibLevels = calculateFibRetracement(swingLow, swingHigh, currentPrice);

  let stopLoss: number;
  let takeProfit: number;
  let basedOn = "";

  if (direction === "BUY") {
    // SL at nearest fib support below price, or 61.8% below swing
    const supportFib = fibLevels
      .filter((f) => f.price < currentPrice)
      .sort((a, b) => b.price - a.price)[0];

    if (supportFib && supportFib.ratio === 0.618) {
      stopLoss = supportFib.price - atr * 0.3;
      basedOn = "Fib 61.8% (Golden)";
    } else if (supportFib) {
      stopLoss = supportFib.price - atr * 0.5;
      basedOn = `Fib ${supportFib.label}`;
    } else {
      stopLoss = currentPrice - atr * 1.5;
      basedOn = "ATR-based";
    }

    // TP at 161.8% extension
    const range = swingHigh - swingLow;
    takeProfit =
      currentPrice + range * 1.618 > swingHigh
        ? swingHigh + range * 0.618
        : currentPrice + atr * 2.5;
  } else if (direction === "SELL") {
    // SL at nearest fib resistance above price
    const resistanceFib = fibLevels
      .filter((f) => f.price > currentPrice)
      .sort((a, b) => a.price - b.price)[0];

    if (resistanceFib && resistanceFib.ratio === 0.618) {
      stopLoss = resistanceFib.price + atr * 0.3;
      basedOn = "Fib 61.8% (Golden)";
    } else if (resistanceFib) {
      stopLoss = resistanceFib.price + atr * 0.5;
      basedOn = `Fib ${resistanceFib.label}`;
    } else {
      stopLoss = currentPrice + atr * 1.5;
      basedOn = "ATR-based";
    }

    const range = swingHigh - swingLow;
    takeProfit =
      currentPrice - range * 1.618 < swingLow
        ? swingLow - range * 0.618
        : currentPrice - atr * 2.5;
  } else {
    stopLoss = currentPrice - atr;
    takeProfit = currentPrice + atr;
    basedOn = "ATR neutral";
  }

  // Format based on instrument
  const isXau = symbol.includes("XAU") || symbol.includes("GC");
  const isJpy = symbol.includes("JPY");
  const precision = isXau ? 2 : isJpy ? 3 : 5;
  const multiplier = Math.pow(10, precision);

  stopLoss = Math.round(stopLoss * multiplier) / multiplier;
  takeProfit = Math.round(takeProfit * multiplier) / multiplier;

  const risk = Math.abs(currentPrice - stopLoss);
  const reward = Math.abs(takeProfit - currentPrice);
  const rr = risk > 0 ? (reward / risk).toFixed(1) : "1.0";

  return {
    stopLoss,
    takeProfit,
    riskReward: `1:${rr}`,
    basedOn,
  };
}
