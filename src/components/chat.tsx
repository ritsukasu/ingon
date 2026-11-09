"use client";

import { CodeXml, RotateCcw, SquarePen } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useChat } from "@/hooks/use-chat";
import { AUTHOR_HANDLE, REPO_URL } from "@/lib/site";
import { Composer } from "./composer";
import { Templates, Welcome } from "./empty-state";
import { LogoGlyph } from "./logo";
import { Message } from "./message";
import { ThemeToggle } from "./theme-toggle";
import { Button } from "./ui/button";

export function Chat() {
  const { messages, status, error, send, retry, stop, reset } = useChat();
  const streaming = status === "streaming";
  const empty = messages.length === 0;

  const [model, setModel] = useState<string | null>(null);
  useEffect(() => {
    fetch("/api/health")
      .then((r) => r.json())
      .then((d: { model?: string | null }) => setModel(d.model ?? null))
      .catch(() => undefined);
  }, []);

  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const stick = useRef(true);

  function onScroll() {
    const el = scrollRef.current;
    if (!el) return;
    stick.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
  }

  useEffect(() => {
    if (stick.current) bottomRef.current?.scrollIntoView({ block: "end" });
  }, [messages, error]);

  function handleSend(text: string) {
    stick.current = true;
    send(text);
  }

  return (
    <div className="relative z-10 flex h-dvh flex-col items-center justify-center gap-4 px-3 py-4 sm:py-8">
      <div className="flex shrink-0 items-center gap-2">
        <div className="rounded-lg border border-line bg-surface px-3 py-2 font-mono text-xs">
          Chatbot Application by <span className="font-bold">{AUTHOR_HANDLE}</span>
        </div>
        <a
          href={REPO_URL}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="View source code"
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-line bg-surface transition-colors hover:bg-accent-soft"
        >
          <CodeXml size={15} />
        </a>
      </div>

      <section
        aria-label="Chat"
        className="flex min-h-0 w-full max-w-xl flex-1 flex-col overflow-hidden rounded-xl border border-line bg-surface shadow-2xl shadow-black/30 sm:max-h-[680px]"
      >
        <header className="flex shrink-0 items-center justify-between border-b border-line px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-line bg-accent-soft">
              <LogoGlyph className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-sm font-medium leading-tight">Ingon</h1>
              <p className="text-xs text-muted">{model ?? "AI chatbot"}</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            {!empty && (
              <Button variant="outline" size="icon" onClick={reset} aria-label="New chat">
                <SquarePen size={15} />
              </Button>
            )}
            <ThemeToggle />
          </div>
        </header>

        <div ref={scrollRef} onScroll={onScroll} className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
          {empty ? (
            <Welcome />
          ) : (
            <div role="log" aria-live="polite" aria-label="Conversation" className="space-y-4">
              {messages.map((m, i) => (
                <Message key={m.id} message={m} pending={streaming && i === messages.length - 1} />
              ))}
            </div>
          )}

          {error && (
            <div
              role="alert"
              className="mt-4 flex items-center justify-between gap-3 rounded-md border border-danger/40 bg-danger/10 px-3 py-2.5 text-xs text-danger"
            >
              <span>{error}</span>
              <Button variant="outline" size="sm" onClick={retry} className="h-8 text-ink">
                <RotateCcw size={13} />
                Try again
              </Button>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {empty && <Templates onPick={handleSend} />}

        <div className="shrink-0 px-4 pb-4 pt-1">
          <Composer streaming={streaming} onSend={handleSend} onStop={stop} />
        </div>
      </section>
    </div>
  );
}
