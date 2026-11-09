import type { ChatMessage } from "@/lib/types";
import { LogoGlyph } from "./logo";
import { Markdown } from "./markdown";

export function Message({ message, pending }: { message: ChatMessage; pending: boolean }) {
  if (message.role === "user") {
    return (
      <div className="flex justify-end">
        <p className="max-w-[85%] whitespace-pre-wrap break-words rounded-lg bg-ink px-3 py-2 text-sm leading-6 text-bg">
          {message.content}
        </p>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-2.5">
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-line bg-bg">
        <LogoGlyph className="h-4 w-4" />
      </div>
      <div className="min-w-0 max-w-[88%] rounded-lg border border-line bg-accent-soft/60 px-3 py-2">
        {message.content ? (
          <Markdown>{message.content}</Markdown>
        ) : pending ? (
          <span className="flex gap-1.5 py-2" role="status" aria-label="Ingon is thinking">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="h-1.5 w-1.5 animate-pulse3 rounded-full bg-ink"
                style={{ animationDelay: `${i * 160}ms` }}
              />
            ))}
          </span>
        ) : null}
      </div>
    </div>
  );
}
