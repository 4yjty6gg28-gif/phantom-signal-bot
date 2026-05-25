import {
  mysqlTable,
  mysqlEnum,
  serial,
  varchar,
  text,
  timestamp,
  decimal,
  int,
  bigint,
} from "drizzle-orm/mysql-core";

// ─── Trading Signals ───
export const signals = mysqlTable("signals", {
  id: serial("id").primaryKey(),
  symbol: varchar("symbol", { length: 20 }).notNull(),
  direction: mysqlEnum("direction", ["BUY", "SELL", "NEUTRAL"]).notNull(),
  confidence: int("confidence").notNull(), // 0-100
  entryPrice: decimal("entry_price", { precision: 15, scale: 5 }),
  stopLoss: decimal("stop_loss", { precision: 15, scale: 5 }),
  takeProfit: decimal("take_profit", { precision: 15, scale: 5 }),
  reasoning: text("reasoning"),
  riskReward: varchar("risk_reward", { length: 20 }),
  timeframe: varchar("timeframe", { length: 10 }).notNull().default("M15"),
  status: mysqlEnum("status", ["ACTIVE", "HIT_TP", "HIT_SL", "EXPIRED"])
    .notNull()
    .default("ACTIVE"),
  telegramChatId: varchar("telegram_chat_id", { length: 50 }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ─── AI Votes per Signal ───
export const aiVotes = mysqlTable("ai_votes", {
  id: serial("id").primaryKey(),
  signalId: bigint("signal_id", { mode: "number", unsigned: true })
    .notNull(),
  modelName: varchar("model_name", { length: 50 }).notNull(),
  direction: mysqlEnum("direction", ["BUY", "SELL", "NEUTRAL"]).notNull(),
  confidence: int("confidence").notNull(), // 0-100
  reasoning: text("reasoning"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ─── User Subscriptions ───
export const subscriptions = mysqlTable("subscriptions", {
  id: serial("id").primaryKey(),
  telegramChatId: varchar("telegram_chat_id", { length: 50 }).notNull(),
  telegramUsername: varchar("telegram_username", { length: 100 }),
  isActive: int("is_active").notNull().default(1),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ─── Bot Settings (simpan di DB biar gampang diedit via web) ───
export const botSettings = mysqlTable("bot_settings", {
  id: serial("id").primaryKey(),
  key: varchar("key", { length: 50 }).notNull().unique(),
  value: text("value"),
  description: varchar("description", { length: 255 }),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
