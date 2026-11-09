<h1 align="center">Ingon</h1>

<p align="center">
  A fast, streaming AI chatbot with a clean interface and a hardened API.<br/>
  Built with Next.js, Tailwind CSS, and Google Gemini.
</p>

<p align="center">
  Made by <strong>ritsuka</strong>
</p>

---

## Demo

<p align="center">
  <video src="docs/demo.mp4" controls muted loop width="640"></video>
</p>

<p align="center">
  <a href="docs/demo.mp4">Watch the MP4</a> · If the player doesn't load on your host, here is a GIF:<br/>
  <img src="docs/demo.gif" alt="Ingon demo" width="480" />
</p>

> The recording uses a local **mock model** with canned replies (`npm run demo`), not a live AI.
> Add a real key to `.env.local` and run `npm run dev` for real answers.

### Try it with no API key

```sh
npm install
npm run demo   # starts a mock model + the app using .env.demo (sample key)
```

Open http://localhost:3000. The sample key only works with the bundled mock server (`scripts/mock-llm.mjs`).

## Features

- **Streaming replies** — text appears as the model writes it, with a stop button.
- **Markdown rendering** — lists, tables, and code blocks with one-click copy.
- **Powered by Gemini** (free tier) through Google's OpenAI-compatible endpoint. Any other OpenAI-compatible provider also works via `INGON_BASE_URL`.
- **Server-side secrets** — your API key never reaches the browser.
- **Hardened API** — input validation, rate limiting, origin checks, size limits, and security headers. See [SECURITY.md](./SECURITY.md).
- **Dark and light themes** with a toggle.
- **Accessible** — keyboard friendly, visible focus, screen-reader labels, reduced-motion support.

## Tech stack

| Area       | Choice                                                  |
| ---------- | ------------------------------------------------------- |
| Framework  | [Next.js](https://nextjs.org) (App Router) + TypeScript |
| Styling    | Tailwind CSS with shadcn-style primitives               |
| Icons      | lucide-react                                            |
| Validation | zod                                                     |
| Markdown   | react-markdown + remark-gfm                             |
| AI         | Google Gemini (OpenAI-compatible `/chat/completions`)   |

## Getting started

**Requirements:** Node.js 20+ (npm comes with it).

```bash
# 1. Install
npm install

# 2. Add your Gemini key
cp .env.example .env.local     # Windows PowerShell: copy .env.example .env.local
#    open .env.local and set INGON_API_KEY

# 3. Run
npm run dev
```

Open <http://localhost:3000>.

### Get a free Gemini API key

1. Go to <https://aistudio.google.com/apikey> and sign in with a Google account.
2. Create an API key and copy it.
3. Paste it into `.env.local` as `INGON_API_KEY=...`.
4. Restart `npm run dev` (Next.js reads `.env.local` only at startup).

Free-tier limits and model names change over time. If you see a "model not found" or "rejected the request" error, check `INGON_MODEL` against the models listed in Google AI Studio.

## Environment variables

All variables are read on the server only. Copy `.env.example` to `.env.local`.

| Variable                      | Required | Default                                                     | Description                                           |
| ----------------------------- | :------: | ----------------------------------------------------------- | ----------------------------------------------------- |
| `INGON_API_KEY`               |    ✅    | —                                                           | Provider API key (`GEMINI_API_KEY` / `OPENAI_API_KEY` also accepted). |
| `INGON_BASE_URL`              |          | `https://generativelanguage.googleapis.com/v1beta/openai/`  | OpenAI-compatible base URL.                           |
| `INGON_MODEL`                 |          | `gemini-2.5-flash`                                          | Real model id sent to the provider.                   |
| `INGON_MODEL_LABEL`           |          | `tugon-chat`                                                | Name shown in the chat header (display only).         |
| `INGON_MAX_OUTPUT_TOKENS`     |          | `1024`                                                      | Cap on tokens generated per reply.                    |
| `INGON_MAX_TOKENS_PARAM`      |          | `max_tokens`                                                | Or `max_completion_tokens` for providers that need it.|
| `INGON_TEMPERATURE`           |          | provider default                                            | Leave blank if unsure.                                |
| `INGON_SYSTEM_PROMPT`         |          | built-in prompt                                             | Replaces the default system prompt.                   |
| `INGON_SEND_SESSION_HEADER`   |          | `false`                                                     | For session-aware proxies only.                       |
| `INGON_RATE_LIMIT_MAX`        |          | `20`                                                        | Requests allowed per IP per window.                   |
| `INGON_RATE_LIMIT_WINDOW_SEC` |          | `60`                                                        | Rate-limit window in seconds.                         |
| `INGON_ALLOWED_ORIGINS`       |          | same-origin only                                            | Comma-separated extra origins allowed to call the API.|

### Using another provider

```bash
# Groq
INGON_BASE_URL=https://api.groq.com/openai/v1
INGON_MODEL=<model-id-from-groq>
INGON_API_KEY=<your-groq-key>

# OpenAI
INGON_BASE_URL=https://api.openai.com/v1
INGON_MODEL=gpt-4o-mini
INGON_API_KEY=sk-...
```

## Project structure

```
ingon/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── chat/route.ts     # POST /api/chat — streaming chat endpoint
│   │   │   └── health/route.ts   # GET  /api/health
│   │   ├── globals.css           # theme tokens + markdown styles
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/               # Chat, Composer, Message, Markdown, ui/
│   ├── hooks/use-chat.ts         # streaming client logic
│   └── lib/                      # env, schema, rate-limit, stream, prompt, site
├── docs/API.md                   # API reference
├── .env.example
├── SECURITY.md
└── Dockerfile
```

Backend logic lives in `src/app/api/chat/route.ts`. Change the model or prompt through environment variables, or edit `src/lib/prompt.ts` for the default prompt.

## API

`POST /api/chat` accepts a conversation and streams back plain text. Full details, error codes, and examples are in [docs/API.md](./docs/API.md).

```bash
curl -N http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"Say hi in Cebuano"}]}'
```

## Scripts

| Command             | What it does               |
| ------------------- | -------------------------- |
| `npm run dev`       | Start the dev server       |
| `npm run build`     | Production build           |
| `npm start`         | Run the production build   |
| `npm run lint`      | Lint with ESLint           |
| `npm run typecheck` | Type-check with TypeScript |

## Deployment

**Vercel:** import the repo and add the variables from `.env.example` under *Project Settings → Environment Variables*.

**Docker:**

```bash
docker build -t ingon .
docker run --env-file .env.local -p 3000:3000 ingon
```

> The built-in rate limiter is per-process. On serverless or multi-instance hosts, replace it with a shared store (see [SECURITY.md](./SECURITY.md)).

## Contributing

Issues and pull requests are welcome. Read [CONTRIBUTING.md](./CONTRIBUTING.md) first. To report a vulnerability, follow [SECURITY.md](./SECURITY.md) instead of opening a public issue.

## Credits

Interface layout inspired by [hyamero/chatbot](https://github.com/hyamero/chatbot).

## License

[MIT](./LICENSE) © 2026 ritsuka
