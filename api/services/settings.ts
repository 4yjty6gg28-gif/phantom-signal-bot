import { eq } from "drizzle-orm";
import { getDb } from "../queries/connection.js";
import { botSettings } from "../../db/schema.js";

export const DEFAULT_SETTINGS = {
  TELEGRAM_BOT_TOKEN: {
    key: "TELEGRAM_BOT_TOKEN",
    value: "",
    description: "Token dari @BotFather di Telegram",
  },
  KIMI_API_KEY: {
    key: "KIMI_API_KEY",
    value: "",
    description: "API Key dari platform.moonshot.cn (opsional)",
  },
  OPENROUTER_API_KEY: {
    key: "OPENROUTER_API_KEY",
    value: "",
    description: "API Key dari openrouter.ai (opsional)",
  },
};

export async function ensureDefaultSettings() {
  try {
    const db = getDb();
    for (const def of Object.values(DEFAULT_SETTINGS)) {
      await db
        .insert(botSettings)
        .values({
          key: def.key,
          value: def.value,
          description: def.description,
        })
        .onDuplicateKeyUpdate({
          set: { description: def.description },
        });
    }
  } catch (err) {
    console.error("ensureDefaultSettings error:", err);
  }
}

export async function getSettings() {
  await ensureDefaultSettings();
  const db = getDb();
  try {
    return await db.select().from(botSettings);
  } catch (err) {
    console.error("getSettings error:", err);
    return Object.values(DEFAULT_SETTINGS).map((d) => ({
      id: 0,
      key: d.key,
      value: d.value,
      description: d.description,
      updatedAt: new Date(),
    }));
  }
}

export async function getSetting(key: string): Promise<string | null> {
  try {
    const db = getDb();
    const result = await db
      .select()
      .from(botSettings)
      .where(eq(botSettings.key, key))
      .limit(1);
    return result[0]?.value ?? null;
  } catch {
    // If DB not available, check env
    const envMap: Record<string, string | undefined> = {
      TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN,
      KIMI_API_KEY: process.env.KIMI_API_KEY,
      OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY,
    };
    return envMap[key] ?? null;
  }
}

export async function updateSetting(key: string, value: string) {
  const db = getDb();
  await db
    .insert(botSettings)
    .values({ key, value, description: "" })
    .onDuplicateKeyUpdate({ set: { value, updatedAt: new Date() } });
  return { success: true };
}

export async function updateSettings(
  settings: { key: string; value: string }[]
) {
  const db = getDb();
  for (const s of settings) {
    await db
      .insert(botSettings)
      .values({ key: s.key, value: s.value, description: "" })
      .onDuplicateKeyUpdate({ set: { value: s.value, updatedAt: new Date() } });
  }
  return { success: true };
}
