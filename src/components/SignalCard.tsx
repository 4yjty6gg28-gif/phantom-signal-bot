import { TrendingUp, TrendingDown, Minus, Clock, Target, Shield, Sparkles } from "lucide-react";

interface AIVote {
  id?: number;
  modelName: string;
  direction: "BUY" | "SELL" | "NEUTRAL";
  confidence: number;
  reasoning: string | null;
}

interface Signal {
  id: number;
  symbol: string;
  direction: "BUY" | "SELL" | "NEUTRAL";
  confidence: number;
  entryPrice: string | null;
  stopLoss: string | null;
  takeProfit: string | null;
  riskReward: string | null;
  reasoning: string | null;
  timeframe: string;
  status: string;
  createdAt: Date;
  aiVotes?: AIVote[];
}

interface SignalCardProps {
  signal: Signal;
}

export default function SignalCard({ signal }: SignalCardProps) {
  const directionConfig = {
    BUY: {
      icon: TrendingUp,
      color: "text-emerald-400",
      bg: "bg-emerald-500/10",
      border: "border-emerald-500/30",
      badge: "bg-emerald-500/20 text-emerald-400",
    },
    SELL: {
      icon: TrendingDown,
      color: "text-red-400",
      bg: "bg-red-500/10",
      border: "border-red-500/30",
      badge: "bg-red-500/20 text-red-400",
    },
    NEUTRAL: {
      icon: Minus,
      color: "text-slate-400",
      bg: "bg-slate-500/10",
      border: "border-slate-500/30",
      badge: "bg-slate-500/20 text-slate-400",
    },
  };

  const config = directionConfig[signal.direction];
  const Icon = config.icon;

  const formatPrice = (price: string | null) => {
    if (!price) return "—";
    const num = parseFloat(price);
    return num > 1000 ? num.toFixed(2) : num.toFixed(5);
  };

  const timeAgo = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  return (
    <div
      className={`bg-gradient-to-br from-slate-800/80 to-slate-900/80 border ${config.border} rounded-xl p-5 hover:shadow-lg hover:shadow-${signal.direction === "BUY" ? "emerald" : signal.direction === "SELL" ? "red" : "slate"}-500/5 transition-all duration-300`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`p-2 ${config.bg} rounded-lg`}>
            <Icon className={`w-5 h-5 ${config.color}`} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">{signal.symbol}</h3>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <Clock className="w-3 h-3" />
              {timeAgo(signal.createdAt)} · {signal.timeframe}
            </div>
          </div>
        </div>
        <div className="text-right">
          <span className={`px-3 py-1 rounded-full text-sm font-bold ${config.badge}`}>
            {signal.direction}
          </span>
          <div className="mt-1 text-xs text-slate-500">
            Confidence: {signal.confidence}%
          </div>
        </div>
      </div>

      {/* Price Levels */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="bg-slate-900/50 rounded-lg p-3">
          <div className="flex items-center gap-1 text-xs text-slate-500 mb-1">
            <Target className="w-3 h-3" /> Entry
          </div>
          <p className="text-sm font-mono font-bold text-white">
            {formatPrice(signal.entryPrice)}
          </p>
        </div>
        <div className="bg-slate-900/50 rounded-lg p-3">
          <div className="flex items-center gap-1 text-xs text-red-500/70 mb-1">
            <Shield className="w-3 h-3" /> SL
          </div>
          <p className="text-sm font-mono font-bold text-red-400">
            {formatPrice(signal.stopLoss)}
          </p>
        </div>
        <div className="bg-slate-900/50 rounded-lg p-3">
          <div className="flex items-center gap-1 text-xs text-emerald-500/70 mb-1">
            <Target className="w-3 h-3" /> TP
          </div>
          <p className="text-sm font-mono font-bold text-emerald-400">
            {formatPrice(signal.takeProfit)}
          </p>
        </div>
      </div>

      {/* Risk:Reward */}
      {signal.riskReward && (
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs text-slate-500">Risk:Reward</span>
          <span className="text-xs font-mono font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded">
            {signal.riskReward}
          </span>
        </div>
      )}

      {/* Confidence Bar */}
      <div className="mb-4">
        <div className="flex justify-between text-xs mb-1">
          <span className="text-slate-500">AI Consensus Confidence</span>
          <span className={config.color}>{signal.confidence}%</span>
        </div>
        <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              signal.direction === "BUY"
                ? "bg-emerald-400"
                : signal.direction === "SELL"
                ? "bg-red-400"
                : "bg-slate-400"
            }`}
            style={{ width: `${signal.confidence}%` }}
          />
        </div>
      </div>

      {/* AI Voting Breakdown */}
      {signal.aiVotes && signal.aiVotes.length > 0 && (
        <div className="border-t border-slate-700/50 pt-3">
          <p className="text-xs text-slate-500 mb-2">AI Voting Results</p>
          <div className="space-y-1.5">
            {signal.aiVotes.map((vote) => (
              <div
                key={vote.id || vote.modelName}
                className="flex items-center justify-between text-xs"
              >
                <span className="text-slate-400">{vote.modelName}</span>
                <div className="flex items-center gap-2">
                  <span
                    className={
                      vote.direction === "BUY"
                        ? "text-emerald-400"
                        : vote.direction === "SELL"
                        ? "text-red-400"
                        : "text-slate-400"
                    }
                  >
                    {vote.direction}
                  </span>
                  <span className="text-slate-500">{vote.confidence}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CRT x FIBO Math Analysis Badge */}
      <div className="border-t border-slate-700/50 pt-3 mt-3">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="w-3.5 h-3.5 text-purple-400" />
          <span className="text-xs font-medium text-purple-400">
            CRT x FIBO Math Enhanced
          </span>
          <span className="text-[10px] text-slate-600 bg-slate-800 px-1.5 py-0.5 rounded">
            +30% confidence boost
          </span>
        </div>
        <div className="grid grid-cols-3 gap-2 text-[10px]">
          <div className="bg-slate-900/50 rounded p-2 text-center">
            <div className="text-slate-500 mb-0.5">Golden Ratio</div>
            <div className="text-amber-400 font-bold">Active</div>
          </div>
          <div className="bg-slate-900/50 rounded p-2 text-center">
            <div className="text-slate-500 mb-0.5">CRT Congruence</div>
            <div className="text-purple-400 font-bold">Active</div>
          </div>
          <div className="bg-slate-900/50 rounded p-2 text-center">
            <div className="text-slate-500 mb-0.5">Harmonic</div>
            <div className="text-cyan-400 font-bold">Active</div>
          </div>
        </div>
      </div>

      {/* Reasoning */}
      {signal.reasoning && (
        <div className="border-t border-slate-700/50 pt-3 mt-3">
          <p className="text-xs text-slate-400 leading-relaxed line-clamp-4">
            {signal.reasoning}
          </p>
        </div>
      )}
    </div>
  );
}
