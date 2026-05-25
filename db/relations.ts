import { relations } from "drizzle-orm";
import { signals, aiVotes, botSettings } from "./schema";

export const signalsRelations = relations(signals, ({ many }) => ({
  aiVotes: many(aiVotes),
}));

export const aiVotesRelations = relations(aiVotes, ({ one }) => ({
  signal: one(signals, {
    fields: [aiVotes.signalId],
    references: [signals.id],
  }),
}));

export const botSettingsRelations = relations(botSettings, () => ({}));
