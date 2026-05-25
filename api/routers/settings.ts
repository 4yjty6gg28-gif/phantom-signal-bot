import { z } from "zod";
import { createRouter, publicQuery } from "../middleware.js";
import {
  getSettings,
  updateSetting,
  updateSettings,
} from "../services/settings.js";

export const settingsRouter = createRouter({
  list: publicQuery.query(async () => {
    return getSettings();
  }),

  update: publicQuery
    .input(
      z.object({
        key: z.string().min(1),
        value: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      return updateSetting(input.key, input.value);
    }),

  updateBatch: publicQuery
    .input(
      z.array(
        z.object({
          key: z.string().min(1),
          value: z.string(),
        })
      )
    )
    .mutation(async ({ input }) => {
      return updateSettings(input);
    }),
});
