// Settings service - NO DATABASE, uses env vars only for Vercel

export async function getSettings() {
  return [
    { key: "TELEGRAM_BOT_TOKEN", value: process.env.TELEGRAM_BOT_TOKEN || "", description: "Token from @BotFather" },
    { key: "KIMI_API_KEY", value: process.env.KIMI_API_KEY || "", description: "Optional" },
    { key: "OPENROUTER_API_KEY", value: process.env.OPENROUTER_API_KEY || "", description: "Optional" },
  ];
}

export async function getSetting(key: string): Promise<string | null> {
  const map: Record<string, string | undefined> = {
    TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN,
    KIMI_API_KEY: process.env.KIMI_API_KEY,
    OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY,
  };
  return map[key] ?? null;
}

export async function updateSetting(_key: string, _value: string) {
  return { success: true };
}

export async function updateSettings(_settings: { key: string; value: string }[]) {
  return { success: true };
}
