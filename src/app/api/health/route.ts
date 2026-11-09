import { getEnv } from "@/lib/env";

export const dynamic = "force-dynamic";

export function GET() {
  let configured = false;
  let model: string | null = null;
  try {
    model = getEnv().INGON_MODEL_LABEL; // display name only
    configured = true;
  } catch {
    /* missing or invalid env */
  }
  return Response.json(
    { status: "ok", configured, model },
    { headers: { "Cache-Control": "no-store" } },
  );
}
