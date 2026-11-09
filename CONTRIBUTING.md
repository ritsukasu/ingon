# Contributing to Ingon

Thanks for helping out.

## Setup

```bash
pnpm install
cp .env.example .env.local   # add your key
pnpm dev
```

## Before opening a pull request

```bash
pnpm lint
pnpm typecheck
pnpm build
```

## Guidelines

- Keep pull requests focused: one change per PR.
- Never commit secrets. `.env.local` is gitignored; keep it that way.
- Any new request field must be validated in `src/lib/schema.ts`.
- Any new environment variable must be added to `src/lib/env.ts`, `.env.example`, and the README table.
- Security issues: follow [SECURITY.md](./SECURITY.md), not a public issue.

By contributing, you agree your work is released under the [MIT License](./LICENSE).
