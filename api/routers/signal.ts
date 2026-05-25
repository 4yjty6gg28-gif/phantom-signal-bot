import { z } from "zod";
import { createRouter, publicQuery } from "../middleware";
import { generateSignal, getSignalHistory, getSignalStats } from "../services/signal";

export const signalRouter = createRouter({
  generate: publicQuery
    .input(
      z.object({
        symbol: z.string().min(1).max(20),
        timeframe: z.string().default("M15"),
      })
    )
    .mutation(async ({ input }) => {
      const signal = await generateSignal(input.symbol, input.timeframe);
      return signal;
    }),

  history: publicQuery
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(50),
      })
    )
    .query(async ({ input }) => {
      return getSignalHistory(input.limit);
    }),

  stats: publicQuery.query(async () => {
    return getSignalStats();
  }),
});
