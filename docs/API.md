# Ingon API

Base URL in development: `http://localhost:3000`

## `POST /api/chat`

Sends a conversation and streams the assistant's reply as plain text.

### Request

Headers:

| Header         | Value              |
| -------------- | ------------------ |
| `Content-Type` | `application/json` |

Body:

```json
{
  "sessionId": "optional-conversation-id",
  "messages": [
    { "role": "user", "content": "What is the capital of Cebu?" },
    { "role": "assistant", "content": "Cebu is a province; its capital is Cebu City." },
    { "role": "user", "content": "How many people live there?" }
  ]
}
```

Rules:

| Field                | Constraint                                          |
| -------------------- | --------------------------------------------------- |
| `sessionId`          | optional; 8–64 chars of `A-Z a-z 0-9 _ -`; forwarded to the provider as `x-agent-session` |
| `messages`           | 1–40 items                                          |
| `messages[].role`    | `"user"` or `"assistant"` (no `system`)             |
| `messages[].content` | user: 1–4000 chars · assistant: 1–16000 chars       |
| Last message         | must have role `user`                               |
| Total characters     | at most 60,000                                      |
| Body size            | at most 256 KB                                      |
| Extra keys           | rejected                                            |

### Response — `200 OK`

`Content-Type: text/plain; charset=utf-8`, streamed in chunks. The body is only the generated text.

Response headers:

| Header                  | Meaning                               |
| ----------------------- | ------------------------------------- |
| `X-Request-Id`          | Unique id; include it in bug reports  |
| `X-RateLimit-Limit`     | Requests allowed per window           |
| `X-RateLimit-Remaining` | Requests left in the current window   |
| `X-RateLimit-Reset`     | Unix time (seconds) when it resets    |

If the stream breaks midway, the connection errors; keep the partial text and retry.

### Errors

Errors return JSON with an HTTP status other than 200:

```json
{ "error": { "code": "rate_limited", "message": "Too many requests. Try again in 12s.", "requestId": "…" } }
```

| Status | `code`                   | Meaning                                              |
| ------ | ------------------------ | ---------------------------------------------------- |
| 400    | `invalid_json`           | Body isn't valid JSON                                |
| 400    | `invalid_request`        | Body failed validation (message names the field)     |
| 403    | `bad_origin`             | Cross-origin request not in `INGON_ALLOWED_ORIGINS`  |
| 413    | `payload_too_large`      | Body exceeds 256 KB                                  |
| 415    | `unsupported_media_type` | Missing `Content-Type: application/json`            |
| 429    | `rate_limited`           | Too many requests; see `Retry-After` header          |
| 500    | `server_misconfigured`   | Missing or invalid server environment variables      |
| 502    | `provider_error`         | The AI provider returned an error                    |
| 502    | `provider_auth`          | The provider rejected the API key                    |
| 502    | `provider_rejected`      | Bad request: usually a wrong key or model name       |
| 502    | `provider_model`         | Model or endpoint not found                          |
| 502    | `provider_unreachable`   | The AI provider couldn't be reached                  |
| 503    | `provider_busy`          | The provider is rate-limiting the server             |
| 504    | `timeout`                | The provider didn't respond within 60 s              |

### Examples

**curl** (`-N` disables buffering so you see the stream):

```bash
curl -N http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"Write a haiku about rain"}]}'
```

**JavaScript:**

```js
const res = await fetch("/api/chat", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ messages: [{ role: "user", content: "Hello" }] }),
});

if (!res.ok) throw new Error((await res.json()).error.message);

const reader = res.body.getReader();
const decoder = new TextDecoder();
for (;;) {
  const { done, value } = await reader.read();
  if (done) break;
  process(decoder.decode(value, { stream: true }));
}
```

## `GET /api/health`

Liveness check. Returns the display name of the model (`INGON_MODEL_LABEL`); never exposes secrets or the real model id.

```json
{ "status": "ok", "configured": true, "model": "tugon-chat" }
```

`configured` is `false` (and `model` is `null`) when required environment variables are missing or invalid.

## `GET /api/chat`

Returns `405 Method Not Allowed`.
