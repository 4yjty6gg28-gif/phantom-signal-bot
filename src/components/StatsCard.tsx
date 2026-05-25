import { TrendingUp, TrendingDown, BarChart3, Zap } from "lucide-react";

interface StatsCardProps {
  total: number;
  buyCount: number;
  sellCount: number;
  neutralCount: number;
  avgConfidence: number;
}

export default function StatsCard({
  total,
  buyCount,
  sellCount,
  neutralCount,
  avgConfidence,
}: StatsCardProps) {
  const buyPct = total > 0 ? Math.round((buyCount / total) * 100) : 0;
  const sellPct = total > 0 ? Math.round((sellCount / total) * 100) : 0;
  const neutralPct = total > 0 ? Math.round((neutralCount / total) * 100) : 0;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
      {/* Total Signals */}
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700/50 rounded-xl p-5">
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2 bg-blue-500/10 rounded-lg">
            <BarChart3 className="w-5 h-5 text-blue-400" />
          </div>
          <span className="text-slate-400 text-sm">Total Signals</span>
        </div>
        <p className="text-3xl font-bold text-white">{total}</p>
        <p className="text-slate-500 text-xs mt-1">All time</p>
      </div>

      {/* BUY Signals */}
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700/50 rounded-xl p-5">
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2 bg-emerald-500/10 rounded-lg">
            <TrendingUp className="w-5 h-5 text-emerald-400" />
          </div>
          <span className="text-slate-400 text-sm">BUY Signals</span>
        </div>
        <p className="text-3xl font-bold text-emerald-400">{buyCount}</p>
        <p className="text-emerald-500/60 text-xs mt-1">{buyPct}% of total</p>
      </div>

      {/* SELL Signals */}
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700/50 rounded-xl p-5">
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2 bg-red-500/10 rounded-lg">
            <TrendingDown className="w-5 h-5 text-red-400" />
          </div>
          <span className="text-slate-400 text-sm">SELL Signals</span>
        </div>
        <p className="text-3xl font-bold text-red-400">{sellCount}</p>
        <p className="text-red-500/60 text-xs mt-1">{sellPct}% of total</p>
      </div>

      {/* Avg Confidence */}
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700/50 rounded-xl p-5">
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2 bg-amber-500/10 rounded-lg">
            <Zap className="w-5 h-5 text-amber-400" />
          </div>
          <span className="text-slate-400 text-sm">Avg Confidence</span>
        </div>
        <p className="text-3xl font-bold text-amber-400">{avgConfidence}%</p>
        <div className="flex items-center gap-1 mt-2">
          <div className="flex-1 h-1.5 bg-slate-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-amber-400 rounded-full transition-all duration-500"
              style={{ width: `${avgConfidence}%` }}
            />
          </div>
        </div>
      </div>

      {/* Distribution Bar */}
      <div className="col-span-2 md:col-span-4 bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700/50 rounded-xl p-5">
        <div className="flex items-center justify-between mb-3">
          <span className="text-slate-400 text-sm">Signal Distribution</span>
          <div className="flex items-center gap-4 text-xs">
            <span className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-emerald-400" />
              BUY {buyPct}%
            </span>
            <span className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-red-400" />
              SELL {sellPct}%
            </span>
            <span className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-slate-400" />
              NEUTRAL {neutralPct}%
            </span>
          </div>
        </div>
        <div className="flex h-3 rounded-full overflow-hidden bg-slate-700">
          <div
            className="bg-emerald-400 transition-all duration-500"
            style={{ width: `${buyPct}%` }}
          />
          <div
            className="bg-red-400 transition-all duration-500"
            style={{ width: `${sellPct}%` }}
          />
          <div
            className="bg-slate-400 transition-all duration-500"
            style={{ width: `${neutralPct}%` }}
          />
        </div>
      </div>
    </div>
  );
}
