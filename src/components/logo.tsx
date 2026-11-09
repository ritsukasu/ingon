import { cn } from "@/lib/utils";

/** The "i" in Ingon: the dot is the voice, the stem is the listener. */
export function Logo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true" className={cn("h-7 w-7 shrink-0 text-accent", className)}>
      <rect width="32" height="32" rx="8" fill="currentColor" />
      <circle cx="16" cy="9.6" r="2.6" fill="rgb(var(--accent-ink))" />
      <rect x="13.6" y="14.2" width="4.8" height="10" rx="2.4" fill="rgb(var(--accent-ink))" />
    </svg>
  );
}

/** Glyph only (no background), for use inside avatar boxes. */
export function LogoGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true" className={cn("h-5 w-5", className)}>
      <circle cx="16" cy="8.6" r="3" fill="currentColor" />
      <rect x="13.4" y="14" width="5.2" height="12" rx="2.6" fill="currentColor" />
    </svg>
  );
}
