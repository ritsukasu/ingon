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
  <a href="docs/demo.mp4">Watch the MP4</a>
</p>

> The recording uses a local mock model (`npm run demo`), not a live AI.

## Features

- **Streaming replies** with a stop button.
- **Markdown rendering** with one-click code copy.
- **Gemini free tier**, or any OpenAI-compatible provider via `INGON_BASE_URL`.
- **Hardened API:** validation, rate limiting, origin checks, and security headers.
- **Dark and light themes.**

## Getting started

Requires Node.js 20+.

```bash
npm install
cp .env.example .env.local   # set INGON_API_KEY (free key: https://aistudio.google.com/apikey)
npm run dev
```

Open <http://localhost:3000>. No key? Run `npm run demo` to try it with the mock model.

## Environment variables

| Variable          | Required | Default                                                    | Description                    |
| ----------------- | :------: | ---------------------------------------------------------- | ------------------------------ |
| `INGON_API_KEY`   |    ✅    | —                                                          | Provider API key.              |
| `INGON_BASE_URL`  |          | `https://generativelanguage.googleapis.com/v1beta/openai/` | OpenAI-compatible base URL.    |
| `INGON_MODEL`     |          | `gemini-2.5-flash`                                         | Model id sent to the provider. |

See `.env.example` for the rest.

## Tech stack

Next.js (App Router) + TypeScript, Tailwind CSS, zod, react-markdown, Google Gemini.

## Credits

Interface layout inspired by [hyamero/chatbot](https://github.com/hyamero/chatbot).

## License

[MIT](./LICENSE) © 2026 ritsuka
