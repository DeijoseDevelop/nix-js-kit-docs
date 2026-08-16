import { defineCollection } from "@deijose/nix-js-kit/content";
import { z } from "zod";

export const collections = {
  docs: defineCollection({
    schema: z.object({
      title: z.string(),
      description: z.string(),
      section: z.string(),
      order: z.number(),
      draft: z.boolean().optional(),
    }),
  }),
};
