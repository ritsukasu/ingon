import { z } from "zod";
import {
  MAX_ASSISTANT_MESSAGE_CHARS,
  MAX_MESSAGES,
  MAX_TOTAL_CHARS,
  MAX_USER_MESSAGE_CHARS,
} from "./constants";

const userMessage = z.object({
  role: z.literal("user"),
  content: z.string().trim().min(1).max(MAX_USER_MESSAGE_CHARS),
});

const assistantMessage = z.object({
  role: z.literal("assistant"),
  content: z.string().min(1).max(MAX_ASSISTANT_MESSAGE_CHARS),
});

export const chatRequestSchema = z
  .object({
    sessionId: z
      .string()
      .regex(/^[A-Za-z0-9_-]{8,64}$/)
      .optional(),
    messages: z
      .array(z.discriminatedUnion("role", [userMessage, assistantMessage]))
      .min(1)
      .max(MAX_MESSAGES),
  })
  .strict()
  .refine((d) => d.messages[d.messages.length - 1]?.role === "user", {
    message: "The last message must be from the user.",
    path: ["messages"],
  })
  .refine(
    (d) => d.messages.reduce((sum, m) => sum + m.content.length, 0) <= MAX_TOTAL_CHARS,
    { message: "The conversation is too long.", path: ["messages"] },
  );

export type ChatRequest = z.infer<typeof chatRequestSchema>;
