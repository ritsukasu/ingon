"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { MAX_MESSAGES, MAX_TOTAL_CHARS } from "@/lib/constants";
import type { ApiError, ChatMessage } from "@/lib/types";
import { uid } from "@/lib/utils";

export type ChatStatus = "idle" | "streaming";

/** Keep the request inside the limits the server enforces (drops oldest first). */
function toPayload(history: ChatMessage[]) {
  let msgs = history.slice(-MAX_MESSAGES);
  let total = msgs.reduce((n, m) => n + m.content.length, 0);
  while (msgs.length > 1 && total > MAX_TOTAL_CHARS) {
    total -= msgs[0]!.content.length;
    msgs = msgs.slice(1);
  }
  return msgs.map(({ role, content }) => ({ role, content }));
}

export function useChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [status, setStatus] = useState<ChatStatus>("idle");
  const [error, setError] = useState<string | null>(null);

  const abortRef = useRef<AbortController | null>(null);
  const sessionRef = useRef<string>(uid().replace(/[^A-Za-z0-9_-]/g, "").slice(0, 32).padEnd(8, "0"));
  const messagesRef = useRef(messages);
  messagesRef.current = messages;

  const run = useCallback(async (history: ChatMessage[]) => {
    const assistant: ChatMessage = { id: uid(), role: "assistant", content: "" };
    setMessages([...history, assistant]);
    setStatus("streaming");
    setError(null);

    const controller = new AbortController();
    abortRef.current?.abort();
    abortRef.current = controller;

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: sessionRef.current, messages: toPayload(history) }),
        signal: controller.signal,
      });

      if (!res.ok || !res.body) {
        const data = (await res.json().catch(() => null)) as ApiError | null;
        throw new Error(data?.error?.message ?? "Something went wrong. Try again.");
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        if (chunk) {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistant.id ? { ...m, content: m.content + chunk } : m,
            ),
          );
        }
      }
    } catch (err) {
      if ((err as Error).name !== "AbortError") {
        setError(
          err instanceof TypeError
            ? "Can't reach the server. Check your connection and try again."
            : (err as Error).message,
        );
      }
    } finally {
      // Drop an empty assistant bubble (error or stopped before any text).
      setMessages((prev) => prev.filter((m) => !(m.id === assistant.id && m.content === "")));
      if (abortRef.current === controller) {
        abortRef.current = null;
        setStatus("idle");
      }
    }
  }, []);

  const send = useCallback(
    (text: string) => {
      const content = text.trim();
      if (!content || abortRef.current) return;
      run([...messagesRef.current, { id: uid(), role: "user", content }]);
    },
    [run],
  );

  const retry = useCallback(() => {
    if (abortRef.current) return;
    const current = messagesRef.current;
    let end = current.length;
    while (end > 0 && current[end - 1]!.role !== "user") end--;
    if (end > 0) run(current.slice(0, end));
  }, [run]);

  const stop = useCallback(() => abortRef.current?.abort(), []);

  const reset = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    sessionRef.current = uid().replace(/[^A-Za-z0-9_-]/g, "").slice(0, 32).padEnd(8, "0");
    setMessages([]);
    setError(null);
    setStatus("idle");
  }, []);

  useEffect(() => () => abortRef.current?.abort(), []);

  return { messages, status, error, send, retry, stop, reset };
}
