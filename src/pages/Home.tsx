import { useState } from "react";
import { trpc } from "@/providers/trpc";
import { Link } from "react-router";
import StatsCard from "@/components/StatsCard";
import SignalCard from "@/components/SignalCard";
import {
  Search,
  Activity,
  Signal,
  RefreshCw,
  Bot,
  TrendingUp,
  Shield,
  Settings,
} from "lucide-react";

const AVAILABLE_SYMBOLS = [
  "XAUUSD",
  "EURUSD",
  "GBPUSD",
  "USDJPY",
  "AUDUSD",
  "USDCAD",
  "USDCHF",
  "NZDUSD",
  "GBPJPY",
  "BTCUSD",
  "ETHUSD",
  "OIL",
];

export default function Home() {
  const [selectedSymbol, setSelectedSymbol] = useState("XAUUSD");
  const [isGenerating, setIsGenerating] = useState(false);

  // Fetch stats
  const { data: stats, refetch: refetchStats } =
    trpc.signal.stats.useQuery();

  // Fetch history
  const { data: history, refetch: refetchHistory } =
    trpc.signal.history.useQuery({ limit: 20 });

  // Generate signal mutation
  const generateMutation = trpc.signal.generate.useMutation({
    onSuccess: () => {
      refetchStats();
      refetchHistory();
      setIsGenerating(false);
    },
    onError: () => {
      setIsGenerating(false);
    },
  });

  const handleGenerate = () => {
    setIsGenerating(true);
    generateMutation.mutate({ symbol: selectedSymbol, timeframe: "M15" });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
      {/* Header */}
      <header className="border-b border-slate-800/50 bg-slate-900/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-lg">
                <Activity className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
                  Phantom Signal Bot
                </h1>
                <p className="text-xs text-slate-500">
                  Multi-AI Trading Intelligence
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Link
                to="/settings"
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700/50 transition-colors"
              >
                <Settings className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-xs text-slate-400 font-medium">
                  Pengaturan
                </span>
              </Link>
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 rounded-full border border-emerald-500/20">
                <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                <span className="text-xs text-emerald-400 font-medium">
                  Online
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        <div className="mb-10 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-500/10 rounded-full border border-indigo-500/20 mb-4">
            <Bot className="w-4 h-4 text-indigo-400" />
            <span className="text-sm text-indigo-400">
              4 AI Models · Real-time Analysis · Consensus Voting
            </span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold mb-3">
            AI-Powered Trading Signals
          </h2>
          <p className="text-slate-400 max-w-2xl mx-auto">
            Our multi-agent AI system analyzes market data using Kimi, Claude,
            GPT-4o, and DeepSeek. Each model votes independently for a
            consensus-driven signal.
          </p>
        </div>

        {/* Signal Generator */}
        <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 border border-slate-700/50 rounded-xl p-6 mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Signal className="w-5 h-5 text-indigo-400" />
            <h3 className="text-lg font-bold">Generate Signal</h3>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <label className="text-xs text-slate-500 mb-2 block">
                Select Symbol
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <select
                  value={selectedSymbol}
                  onChange={(e) => setSelectedSymbol(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg py-3 pl-10 pr-4 text-white appearance-none focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500"
                >
                  {AVAILABLE_SYMBOLS.map((sym) => (
                    <option key={sym} value={sym}>
                      {sym}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-end">
              <button
                onClick={handleGenerate}
                disabled={isGenerating}
                className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 rounded-lg font-medium text-white transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isGenerating ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <TrendingUp className="w-4 h-4" />
                    Get Signal
                  </>
                )}
              </button>
            </div>
          </div>

          {generateMutation.data && (
            <div className="mt-6 p-4 bg-indigo-500/10 border border-indigo-500/30 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Shield className="w-4 h-4 text-indigo-400" />
                <span className="text-sm font-medium text-indigo-400">
                  New Signal Generated
                </span>
              </div>
              <p className="text-sm text-slate-300">
                {generateMutation.data.symbol} —{" "}
                <span
                  className={
                    generateMutation.data.direction === "BUY"
                      ? "text-emerald-400"
                      : generateMutation.data.direction === "SELL"
                      ? "text-red-400"
                      : "text-slate-400"
                  }
                >
                  {generateMutation.data.direction}
                </span>{" "}
                (Confidence: {generateMutation.data.confidence}%)
              </p>
            </div>
          )}
        </div>

        {/* Stats Section */}
        {stats && (
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <Activity className="w-5 h-5 text-indigo-400" />
              <h3 className="text-lg font-bold">Performance Statistics</h3>
            </div>
            <StatsCard
              total={stats.total}
              buyCount={stats.buyCount}
              sellCount={stats.sellCount}
              neutralCount={stats.neutralCount}
              avgConfidence={stats.avgConfidence}
            />
          </div>
        )}

        {/* Signal History */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Signal className="w-5 h-5 text-indigo-400" />
              <h3 className="text-lg font-bold">Recent Signals</h3>
            </div>
            <button
              onClick={() => refetchHistory()}
              className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
            >
              <RefreshCw className="w-4 h-4 text-slate-400" />
            </button>
          </div>

          {history && history.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2">
              {history.map((signal) => (
                <SignalCard
                  key={signal.id}
                  signal={signal as any}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-slate-800/30 border border-slate-700/30 rounded-xl">
              <Signal className="w-12 h-12 text-slate-600 mx-auto mb-4" />
              <p className="text-slate-500">No signals generated yet</p>
              <p className="text-slate-600 text-sm mt-1">
                Use the generator above to create your first signal
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <footer className="border-t border-slate-800/50 pt-8 pb-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Bot className="w-4 h-4 text-slate-600" />
            <span className="text-sm text-slate-500">
              Phantom Signal Bot v1.0
            </span>
          </div>
          <p className="text-xs text-slate-600 max-w-lg mx-auto">
            This system uses multiple AI models for market analysis. Signals are
            for educational purposes only. Always conduct your own research and
            use proper risk management. Trading involves significant risk of
            loss.
          </p>
          <div className="flex items-center justify-center gap-4 mt-4 text-xs text-slate-600">
            <span>AI Models: Kimi K2 · Claude 3.5 · GPT-4o · DeepSeek V3</span>
          </div>
        </footer>
      </main>
    </div>
  );
}
