/**
 * Converts an OpenAI-compatible Server-Sent Events stream
 * (`data: {"choices":[{"delta":{"content":"..."}}]}`) into a plain UTF-8
 * text stream containing only the generated text.
 */
export function sseToTextStream(
  upstream: ReadableStream<Uint8Array>,
): ReadableStream<Uint8Array> {
  const reader = upstream.getReader();
  const decoder = new TextDecoder();
  const encoder = new TextEncoder();
  let buffer = "";

  return new ReadableStream<Uint8Array>({
    async pull(controller) {
      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          controller.close();
          return;
        }

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        let text = "";
        let finished = false;

        for (const rawLine of lines) {
          const line = rawLine.trim();
          if (!line.startsWith("data:")) continue;
          const data = line.slice(5).trim();
          if (data === "[DONE]") {
            finished = true;
            break;
          }
          try {
            const json = JSON.parse(data) as {
              choices?: { delta?: { content?: unknown } }[];
            };
            const delta = json.choices?.[0]?.delta?.content;
            if (typeof delta === "string") text += delta;
          } catch {
            /* ignore keep-alives and partial frames */
          }
        }

        if (text) controller.enqueue(encoder.encode(text));

        if (finished) {
          await reader.cancel().catch(() => undefined);
          controller.close();
          return;
        }
        if (text) return; // hand the chunk to the client, pull again later
      }
    },
    cancel(reason) {
      return reader.cancel(reason);
    },
  });
}
