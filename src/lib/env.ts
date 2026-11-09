import "server-only";
import { z } from "zod";

const schema = z.object({
  INGON_API_KEY: z.string().min(1, "INGON_API_KEY is required"),
  INGON_MODEL: z.string().min(1).default("gemini-2.5-flash"),
  INGON_MODEL_LABEL: z.string().min(1).max(40).default("tugon-chat"),
  INGON_BASE_URL: z
    .string()
    .url()
    .default("https://generativelanguage.googleapis.com/v1beta/openai/"),
  INGON_SEND_SESSION_HEADER: z.enum(["true", "false"]).default("false"),
  INGON_MAX_TOKENS_PARAM: z
    .enum(["max_tokens", "max_completion_tokens"])
    .default("max_tokens"),
  INGON_MAX_OUTPUT_TOKENS: z.coerce.number().int().min(16).max(8192).default(1024),
  INGON_TEMPERATURE: z.coerce.number().min(0).max(2).optional(),
  INGON_SYSTEM_PROMPT: z.string().optional(),
  INGON_RATE_LIMIT_MAX: z.coerce.number().int().min(1).max(10000).default(20),
  INGON_RATE_LIMIT_WINDOW_SEC: z.coerce.number().int().min(1).max(86400).default(60),
  INGON_ALLOWED_ORIGINS: z.string().optional(),
});

export type Env = z.infer<typeof schema>;

let cached: Env | null = null;

/**
 * Parses and validates server environment variables once.
 * Empty strings (e.g. `INGON_TEMPERATURE=`) are treated as "not set".
 */
export function getEnv(): Env {
  if (cached) return cached;

  const raw: Record<string, string | undefined> = Object.fromEntries(
    Object.entries(process.env).filter(([, v]) => v !== undefined && v.trim() !== ""),
  );
  // Accept the key under INGON_API_KEY, GEMINI_API_KEY or the legacy OPENAI_API_KEY.
  raw.INGON_API_KEY = raw.INGON_API_KEY ?? raw.GEMINI_API_KEY ?? raw.OPENAI_API_KEY;
  const parsed = schema.safeParse(raw);

  if (!parsed.success) {
    // Log which variables are wrong — never their values.
    const problems = parsed.error.issues
      .map((i) => `${i.path.join(".") || "env"}: ${i.message}`)
      .join("; ");
    throw new Error(`Invalid environment configuration — ${problems}`);
  }

  cached = parsed.data;
  return cached;
}

export function isConfigured(): boolean {
  try {
    getEnv();
    return true;
  } catch {
    return false;
  }
}
