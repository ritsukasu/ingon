"use client";

import { Send, Square } from "lucide-react";
import { useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { MAX_USER_MESSAGE_CHARS } from "@/lib/constants";
import { Button } from "./ui/button";

interface ComposerProps {
  streaming: boolean;
  onSend: (text: string) => void;
  onStop: () => void;
}

export function Composer({ streaming, onSend, onStop }: ComposerProps) {
  const [value, setValue] = useState("");
  const ref = useRef<HTMLTextAreaElement>(null);

  const trimmed = value.trim();
  const canSend = trimmed.length > 0 && !streaming;

  function resize() {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }

  function submit(e?: FormEvent) {
    e?.preventDefault();
    if (!canSend) return;
    onSend(trimmed);
    setValue("");
    requestAnimationFrame(() => {
      if (ref.current) ref.current.style.height = "auto";
    });
  }

  function onKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      submit();
    }
  }

  return (
    <form onSubmit={submit} className="flex items-end gap-2">
      <label htmlFor="ingon-input" className="sr-only">
        Message Ingon
      </label>
      <div className="flex-1 rounded-md border border-line bg-bg/60 focus-within:border-ink/50 focus-within:ring-1 focus-within:ring-ink/30">
        <textarea
          id="ingon-input"
          ref={ref}
          rows={1}
          value={value}
          maxLength={MAX_USER_MESSAGE_CHARS}
          placeholder="Type your message..."
          autoComplete="off"
          onChange={(e) => {
            setValue(e.target.value);
            resize();
          }}
          onKeyDown={onKeyDown}
          className="block max-h-40 min-h-9 w-full resize-none bg-transparent px-3 py-[7px] text-sm leading-[22px] outline-none placeholder:text-muted focus-visible:outline-none"
        />
      </div>
      {streaming ? (
        <Button className="h-9 w-9" size="icon" onClick={onStop} aria-label="Stop generating">
          <Square size={13} fill="currentColor" />
        </Button>
      ) : (
        <Button className="h-9 w-9" type="submit" size="icon" disabled={!canSend} aria-label="Send message">
          <Send size={15} />
        </Button>
      )}
    </form>
  );
}
