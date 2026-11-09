<h1 align="center">Ingon</h1>

<p align="center">
  A simple AI chatbot.<br/>
  Built with Next.js and Tailwind CSS.
</p>

<p align="center">
  Made by <strong>ritsuka</strong>
</p>

---

## Demo

<p align="center">
  <a href="docs/demo.mp4">
    <img src="docs/demo.gif" alt="Ingon demo (click for the MP4)" width="640" />
  </a>
  <br/>
  <a href="docs/demo.mp4">Watch the MP4</a>
</p>

> The recording uses a local mock model (`npm run demo`), not a live AI.

## Features

- **Streaming replies** with a stop button.
- **Markdown rendering** with one-click code copy.
- **Works with any OpenAI-compatible provider** via `INGON_BASE_URL`.
- **Hardened API:** validation, rate limiting, origin checks, and security headers.
- **Dark and light themes.**

## Getting started

Requires Node.js 20+.

```bash
git clone https://github.com/ritsukasu/ingon.git
cd ingon
npm install
cp .env.example .env.local   # set INGON_API_KEY
npm run dev
```

Open <http://localhost:3000>. No key? Run `npm run demo` to try it with the mock model.

## Environment variables

| Variable          | Required | Default                                                    | Description                    |
| ----------------- | :------: | ---------------------------------------------------------- | ------------------------------ |
| `INGON_API_KEY`   |    ✅    | —                                                          | Provider API key.              |
| `INGON_BASE_URL`  |          | see `.env.example`                                         | OpenAI-compatible base URL.    |
| `INGON_MODEL`     |          | see `.env.example`                                         | Model id sent to the provider. |

See `.env.example` for the rest.

## Tech stack

Next.js (App Router) + TypeScript, Tailwind CSS, zod, react-markdown.

## Credits

Interface layout inspired by [hyamero/chatbot](https://github.com/hyamero/chatbot).

## License

[MIT](./LICENSE) © 2026 ritsuka
