import { useState, useEffect } from "react";
import { trpc } from "@/providers/trpc";
import { Link } from "react-router";
import {
  ArrowLeft,
  Save,
  Check,
  AlertTriangle,
  Bot,
  Key,
  Sparkles,
  Globe,
  Zap,
  Copy,
  ExternalLink,
} from "lucide-react";

export default function Settings() {
  const { data: settings, refetch, isError } = trpc.settings.list.useQuery();
  const updateBatchMutation = trpc.settings.updateBatch.useMutation({
    onSuccess: () => refetch(),
  });

  const [telegramToken, setTelegramToken] = useState("");
  const [kimiKey, setKimiKey] = useState("");
  const [openrouterKey, setOpenrouterKey] = useState("");
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  // Webhook state
  const [deployUrl, setDeployUrl] = useState("");
  const [webhookResult, setWebhookResult] = useState<string | null>(null);
  const [webhookLoading, setWebhookLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  // Load values from DB when settings fetched
  useEffect(() => {
    if (settings) {
      for (const s of settings) {
        if (s.key === "TELEGRAM_BOT_TOKEN") setTelegramToken(s.value || "");
        if (s.key === "KIMI_API_KEY") setKimiKey(s.value || "");
        if (s.key === "OPENROUTER_API_KEY") setOpenrouterKey(s.value || "");
      }
    }
  }, [settings]);

  // Auto-detect URL from browser address bar
  useEffect(() => {
    if (typeof window !== "undefined" && window.location.hostname) {
      const host = window.location.hostname;
      if (
        host &&
        host !== "localhost" &&
        host !== "127.0.0.1" &&
        !host.includes(":")
      ) {
        setDeployUrl(host + (window.location.port ? `:${window.location.port}` : ""));
      }
    }
  }, []);

  const handleSave = async () => {
    setSaving(true);
    await updateBatchMutation.mutateAsync([
      { key: "TELEGRAM_BOT_TOKEN", value: telegramToken },
      { key: "KIMI_API_KEY", value: kimiKey },
      { key: "OPENROUTER_API_KEY", value: openrouterKey },
    ]);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  // Generate webhook URL (manual way)
  const generateWebhook = trpc.telegram.generateWebhookUrl.useQuery(
    { deployUrl },
    { enabled: false }
  );

  const handleAutoSetWebhook = async () => {
    setWebhookLoading(true);
    setWebhookResult(null);
    try {
      const result = await generateWebhook.refetch();
      if (result.data?.browserUrl) {
        // Open in new tab
        window.open(result.data.browserUrl, "_blank");
        setWebhookResult("Tab baru sudah dibuka! Telegram akan mengkonfirmasi webhook berhasil di-set.");
      } else {
        setWebhookResult("Gagal generate URL. Coba cara manual di bawah.");
      }
    } catch {
      setWebhookResult("Error. Coba cara manual di bawah.");
    }
    setWebhookLoading(false);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const allFilled = telegramToken.length > 10;
  const step1Done = telegramToken.length > 10;
  const step2Done = kimiKey.length > 5 || openrouterKey.length > 5;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
      {/* Header */}
      <header className="border-b border-slate-800/50 bg-slate-900/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link
                to="/"
                className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-slate-400" />
              </Link>
              <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-lg">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold">Pengaturan Bot</h1>
                <p className="text-xs text-slate-500">
                  Setup Telegram & AI API Keys
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        {/* Error Notice */}
        {isError && (
          <div className="mb-6 bg-amber-500/10 border border-amber-500/20 rounded-xl p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <span className="text-sm text-amber-400">
                Database belum terhubung. Form di bawah tetap bisa diisi dan disimpan.
              </span>
            </div>
          </div>
        )}

        {/* Progress Steps */}
        <div className="mb-8 bg-slate-800/50 border border-slate-700/50 rounded-xl p-5">
          <h3 className="text-sm font-medium text-slate-300 mb-4">
            Progress Setup
          </h3>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                  step1Done
                    ? "bg-emerald-500 text-white"
                    : "bg-slate-700 text-slate-500"
                }`}
              >
                {step1Done ? <Check className="w-3.5 h-3.5" /> : "1"}
              </div>
              <span
                className={`text-sm ${
                  step1Done ? "text-emerald-400" : "text-slate-400"
                }`}
              >
                Token Telegram (wajib)
              </span>
            </div>
            <div className="flex items-center gap-3">
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                  step2Done
                    ? "bg-emerald-500 text-white"
                    : "bg-slate-700 text-slate-500"
                }`}
              >
                {step2Done ? <Check className="w-3.5 h-3.5" /> : "2"}
              </div>
              <span
                className={`text-sm ${
                  step2Done ? "text-emerald-400" : "text-slate-400"
                }`}
              >
                AI API Keys (opsional — tanpa ini pakai smart mock)
              </span>
            </div>
            <div className="flex items-center gap-3">
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                  step1Done
                    ? "bg-emerald-500 text-white"
                    : "bg-slate-700 text-slate-500"
                }`}
              >
                {step1Done ? <Check className="w-3.5 h-3.5" /> : "3"}
              </div>
              <span
                className={`text-sm ${
                  step1Done ? "text-emerald-400" : "text-slate-400"
                }`}
              >
                Set Webhook & mulai pakai
              </span>
            </div>
          </div>
        </div>

        {/* Step 1: Telegram Token */}
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6 mb-6">
          <div className="flex items-center gap-2 mb-1">
            <Bot className="w-5 h-5 text-blue-400" />
            <h2 className="text-lg font-bold">Step 1: Token Telegram</h2>
            <span className="px-2 py-0.5 bg-red-500/20 text-red-400 text-[10px] rounded-full font-medium">
              WAJIB
            </span>
          </div>
          <p className="text-sm text-slate-500 mb-4">
            Token ini didapat dari @BotFather di Telegram. Tanpa ini, bot
            nggak bisa jalan.
          </p>

          <label className="block text-sm text-slate-400 mb-2">
            TELEGRAM_BOT_TOKEN
          </label>
          <div className="relative">
            <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
            <input
              type="text"
              value={telegramToken}
              onChange={(e) => setTelegramToken(e.target.value)}
              placeholder="Contoh: 123456789:ABCdefGHIjklMNOpqrsTUVwxyz"
              className="w-full bg-slate-900 border border-slate-700 rounded-lg py-3 pl-10 pr-4 text-white text-sm placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 font-mono"
            />
          </div>

          {/* Tutorial gampang */}
          <div className="mt-4 bg-slate-900/50 rounded-lg p-4 border border-slate-800">
            <h4 className="text-xs font-medium text-slate-400 mb-2 flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
              Cara dapat token (3 langkah):
            </h4>
            <ol className="text-xs text-slate-500 space-y-1.5 list-decimal list-inside">
              <li>
                Buka Telegram, cari{" "}
                <span className="text-blue-400">@BotFather</span>
              </li>
              <li>
                Kirim{" "}
                <code className="bg-slate-800 px-1 py-0.5 rounded text-slate-300">
                  /newbot
                </code>
                , kasih nama & username
              </li>
              <li>
                Copy token yang dikirim BotFather, paste di atas 👆🏼
              </li>
            </ol>
          </div>
        </div>

        {/* Step 2: AI API Keys */}
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6 mb-6">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-5 h-5 text-purple-400" />
            <h2 className="text-lg font-bold">Step 2: AI API Keys (Opsional)</h2>
            <span className="px-2 py-0.5 bg-slate-700 text-slate-400 text-[10px] rounded-full font-medium">
              OPTIONAL
            </span>
          </div>
          <p className="text-sm text-slate-500 mb-4">
            Tanpa ini bot tetap jalan pakai smart mock (realistis). Dengan API
            key, AI analisis pakai model beneran.
          </p>

          <div className="space-y-4">
            <div>
              <label className="block text-sm text-slate-400 mb-2">
                KIMI_API_KEY
              </label>
              <div className="relative">
                <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
                <input
                  type="text"
                  value={kimiKey}
                  onChange={(e) => setKimiKey(e.target.value)}
                  placeholder="Dari platform.moonshot.cn (gratis)"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg py-3 pl-10 pr-4 text-white text-sm placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm text-slate-400 mb-2">
                OPENROUTER_API_KEY
              </label>
              <div className="relative">
                <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
                <input
                  type="text"
                  value={openrouterKey}
                  onChange={(e) => setOpenrouterKey(e.target.value)}
                  placeholder="Dari openrouter.ai (gratis)"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg py-3 pl-10 pr-4 text-white text-sm placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 font-mono"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Step 3: Webhook */}
        {step1Done && (
          <div className="bg-slate-800/50 border border-emerald-500/30 rounded-xl p-6 mb-6">
            <div className="flex items-center gap-2 mb-1">
              <Zap className="w-5 h-5 text-emerald-400" />
              <h2 className="text-lg font-bold">Step 3: Hubungkan ke Telegram</h2>
            </div>

            <p className="text-sm text-slate-400 mb-5">
              Ini langkah TERAKHIR. Cukup masukkan URL dashboard ini, lalu klik tombol.
            </p>

            {/* Contoh URL */}
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 mb-4">
              <p className="text-xs text-amber-400 font-medium mb-1">
                URL yang dimaksud = yang di address bar browser sekarang
              </p>
              <div className="space-y-0.5">
                <p className="text-[10px] text-slate-500">
                  Kalau address bar kamu: <code className="text-slate-300">https://phantom-signal.vercel.app</code>
                </p>
                <p className="text-[10px] text-slate-500">
                  Yang diisi di bawah: <code className="text-emerald-400 font-mono">phantom-signal.vercel.app</code> (hapus https://)
                </p>
              </div>
            </div>

            {/* Input deploy URL */}
            <label className="block text-sm text-slate-400 mb-2 flex items-center gap-2">
              URL Website Ini
              {deployUrl && (
                <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                  auto-detected dari browser
                </span>
              )}
            </label>
            <div className="relative mb-4">
              <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
              <input
                type="text"
                value={deployUrl}
                onChange={(e) => setDeployUrl(e.target.value)}
                placeholder="phantom-signal.vercel.app"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg py-3 pl-10 pr-4 text-white text-sm placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500"
              />
            </div>

            {/* Auto-set button */}
            <button
              onClick={handleAutoSetWebhook}
              disabled={webhookLoading || !deployUrl}
              className="w-full py-3 bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 rounded-lg font-medium text-white transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 mb-4"
            >
              {webhookLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Menghubungkan...
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4" />
                  Klik Otomatis Hubungkan
                </>
              )}
            </button>

            {webhookResult && (
              <div className={`p-3 rounded-lg text-sm mb-4 ${webhookResult.includes("berhasil") ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30" : "bg-red-500/10 text-red-400 border border-red-500/30"}`}>
                {webhookResult}
              </div>
            )}

            {/* Divider */}
            <div className="flex items-center gap-3 my-4">
              <div className="flex-1 h-px bg-slate-700" />
              <span className="text-xs text-slate-600">atau cara manual</span>
              <div className="flex-1 h-px bg-slate-700" />
            </div>

            {/* Manual way */}
            <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-800">
              <p className="text-xs text-slate-500 mb-2">
                Kalau tombol di atas gagal, coba cara ini:
              </p>
              <ol className="text-xs text-slate-400 space-y-2 list-decimal list-inside mb-3">
                <li>Copy link di bawah ini 👇</li>
                <li>Buka tab browser baru, paste, tekan Enter</li>
                <li>Kalau muncul {""}{"{"}"ok&quot;: true{"}"}, berhasil!</li>
              </ol>
              {deployUrl && (
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-[10px] text-emerald-400 font-mono bg-slate-950 p-2 rounded break-all">
                    {`https://api.telegram.org/bot${telegramToken.slice(0, 10)}.../setWebhook?url=https://${deployUrl.replace(/\/$/, "")}/api/telegram/webhook`}
                  </code>
                  <button
                    onClick={() =>
                      copyToClipboard(
                        `https://api.telegram.org/bot${telegramToken}/setWebhook?url=https://${deployUrl.replace(/\/$/, "")}/api/telegram/webhook`
                      )
                    }
                    className="p-2 hover:bg-slate-800 rounded-lg transition-colors shrink-0"
                    title="Copy link"
                  >
                    {copied ? (
                      <Check className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <Copy className="w-4 h-4 text-slate-500" />
                    )}
                  </button>
                  <a
                    href={`https://api.telegram.org/bot${telegramToken}/setWebhook?url=https://${deployUrl.replace(/\/$/, "")}/api/telegram/webhook`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 hover:bg-slate-800 rounded-lg transition-colors shrink-0"
                    title="Buka di tab baru"
                  >
                    <ExternalLink className="w-4 h-4 text-slate-500" />
                  </a>
                </div>
              )}
              {!deployUrl && (
                <p className="text-[10px] text-amber-500">
                  Isi URL website di atas dulu untuk lihat link-nya
                </p>
              )}
            </div>
          </div>
        )}

        {/* Save Button */}
        <div className="flex items-center gap-4">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 py-3 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 rounded-lg font-medium text-white transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {saving ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Menyimpan...
              </>
            ) : saved ? (
              <>
                <Check className="w-4 h-4" />
                Tersimpan!
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Simpan Pengaturan
              </>
            )}
          </button>
        </div>

        {!allFilled && (
          <p className="text-xs text-amber-500 mt-3 text-center flex items-center justify-center gap-1">
            <AlertTriangle className="w-3 h-3" />
            Isi token Telegram (Step 1) untuk mulai pakai bot
          </p>
        )}

        {/* Back link */}
        <div className="mt-8 text-center">
          <Link
            to="/"
            className="text-sm text-slate-500 hover:text-slate-300 transition-colors"
          >
            ← Kembali ke Dashboard
          </Link>
        </div>
      </main>
    </div>
  );
}
