import { NextRequest } from "next/server";
import { getEnv } from "@/lib/env";
import { DEFAULT_SYSTEM_PROMPT } from "@/lib/prompt";
import { clientKey, rateLimit } from "@/lib/rate-limit";
import { chatRequestSchema } from "@/lib/schema";
import { sseToTextStream } from "@/lib/stream";
import { MAX_BODY_BYTES } from "@/lib/constants";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

const UPSTREAM_TIMEOUT_MS = 60_000;

function json(
  status: number,
  code: string,
  message: string,
  requestId: string,
  extraHeaders: Record<string, string> = {},
) {
  return Response.json(
    { error: { code, message, requestId } },
    {
      status,
      headers: { "Cache-Control": "no-store", "X-Request-Id": requestId, ...extraHeaders },
    },
  );
}

/** Same-origin requests pass; cross-origin only if listed in INGON_ALLOWED_ORIGINS. */
function originAllowed(req: NextRequest, allowList: string | undefined): boolean {
  const origin = req.headers.get("origin");
  if (!origin) return true; // non-browser clients (curl, server-to-server)

  let originHost: string;
  try {
    originHost = new URL(origin).host;
  } catch {
    return false;
  }

  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  if (host && originHost === host) return true;

  const allowed = (allowList ?? "")
    .split(",")
    .map((s) => s.trim().replace(/\/$/, ""))
    .filter(Boolean);
  return allowed.includes(origin);
}

export async function POST(req: NextRequest) {
  const requestId = crypto.randomUUID();

  let env;
  try {
    env = getEnv();
  } catch (err) {
    console.error(`[ingon:${requestId}]`, (err as Error).message);
    return json(500, "server_misconfigured", "The server isn't configured yet.", requestId);
  }

  // 1. Origin check (CSRF / cross-site abuse)
  if (!originAllowed(req, env.INGON_ALLOWED_ORIGINS)) {
    return json(403, "bad_origin", "This origin is not allowed.", requestId);
  }

  // 2. Rate limit
  const rl = rateLimit(
    `chat:${clientKey(req.headers)}`,
    env.INGON_RATE_LIMIT_MAX,
    env.INGON_RATE_LIMIT_WINDOW_SEC * 1000,
  );
  const rlHeaders = {
    "X-RateLimit-Limit": String(rl.limit),
    "X-RateLimit-Remaining": String(rl.remaining),
    "X-RateLimit-Reset": String(Math.ceil(rl.resetAt / 1000)),
  };
  if (!rl.ok) {
    const retryAfter = Math.max(1, Math.ceil((rl.resetAt - Date.now()) / 1000));
    return json(
      429,
      "rate_limited",
      `Too many requests. Try again in ${retryAfter}s.`,
      requestId,
      { ...rlHeaders, "Retry-After": String(retryAfter) },
    );
  }

  // 3. Content type + body size
  if (!req.headers.get("content-type")?.toLowerCase().includes("application/json")) {
    return json(415, "unsupported_media_type", "Send JSON with Content-Type: application/json.", requestId, rlHeaders);
  }
  const declared = Number(req.headers.get("content-length") ?? 0);
  if (declared > MAX_BODY_BYTES) {
    return json(413, "payload_too_large", "Request body is too large.", requestId, rlHeaders);
  }
  const bodyText = await req.text();
  if (bodyText.length > MAX_BODY_BYTES) {
    return json(413, "payload_too_large", "Request body is too large.", requestId, rlHeaders);
  }

  // 4. Validate
  let body: unknown;
  try {
    body = JSON.parse(bodyText);
  } catch {
    return json(400, "invalid_json", "Request body isn't valid JSON.", requestId, rlHeaders);
  }
  const parsed = chatRequestSchema.safeParse(body);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return json(
      400,
      "invalid_request",
      first ? `${first.path.join(".") || "body"}: ${first.message}` : "Invalid request.",
      requestId,
      rlHeaders,
    );
  }

  // 5. Call the provider (the API key never leaves the server)
  const payload: Record<string, unknown> = {
    model: env.INGON_MODEL,
    stream: true,
    [env.INGON_MAX_TOKENS_PARAM]: env.INGON_MAX_OUTPUT_TOKENS,
    messages: [
      { role: "system", content: env.INGON_SYSTEM_PROMPT ?? DEFAULT_SYSTEM_PROMPT },
      ...parsed.data.messages,
    ],
  };
  if (env.INGON_TEMPERATURE !== undefined) payload.temperature = env.INGON_TEMPERATURE;

  let upstream: Response;
  const timeoutCtl = new AbortController();
  const timer = setTimeout(
    () => timeoutCtl.abort(new DOMException("Upstream timeout", "TimeoutError")),
    UPSTREAM_TIMEOUT_MS,
  );
  try {
    upstream = await fetch(`${env.INGON_BASE_URL.replace(/\/$/, "")}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${env.INGON_API_KEY}`,
        // Lets session-aware proxies (e.g. FreeDeepseekAPI) keep one chat per conversation.
        ...(env.INGON_SEND_SESSION_HEADER === "true" && parsed.data.sessionId
          ? { "x-agent-session": `ingon-${parsed.data.sessionId}` }
          : {}),
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.any([req.signal, timeoutCtl.signal]),
    });
    clearTimeout(timer); // timeout covers time-to-first-response, not the whole stream
  } catch (err) {
    clearTimeout(timer);
    const name = (err as Error).name;
    console.error(`[ingon:${requestId}] upstream fetch failed:`, name);
    if (name === "TimeoutError") {
      return json(504, "timeout", "The AI provider took too long to respond.", requestId, rlHeaders);
    }
    return json(502, "provider_unreachable", "Couldn't reach the AI provider. Check your internet connection and INGON_BASE_URL.", requestId, rlHeaders);
  }

  if (!upstream.ok || !upstream.body) {
    // Log status only. Provider error bodies can echo request content.
    console.error(`[ingon:${requestId}] upstream status ${upstream.status}`);
    if (upstream.status === 401 || upstream.status === 403) {
      return json(502, "provider_auth", "The provider rejected the API key. Check INGON_API_KEY in .env.local and restart the server.", requestId, rlHeaders);
    }
    if (upstream.status === 400) {
      return json(502, "provider_rejected", "The provider rejected the request. Check INGON_API_KEY and INGON_MODEL in .env.local, then restart the server.", requestId, rlHeaders);
    }
    if (upstream.status === 404) {
      return json(502, "provider_model", "The provider couldn't find that model or endpoint. Check INGON_MODEL and INGON_BASE_URL.", requestId, rlHeaders);
    }
    if (upstream.status === 429) {
      return json(503, "provider_busy", "The AI provider is busy. Try again shortly.", requestId, rlHeaders);
    }
    return json(502, "provider_error", "The AI provider returned an error.", requestId, rlHeaders);
  }

  return new Response(sseToTextStream(upstream.body), {
    status: 200,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store, no-transform",
      "X-Accel-Buffering": "no",
      "X-Request-Id": requestId,
      ...rlHeaders,
    },
  });
}

export function GET() {
  return new Response(null, { status: 405, headers: { Allow: "POST" } });
}
