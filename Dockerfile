# syntax=docker/dockerfile:1
FROM node:20-alpine AS deps
WORKDIR /app
RUN corepack enable
COPY package.json pnpm-lock.yaml* ./
RUN pnpm install

FROM node:20-alpine AS build
WORKDIR /app
RUN corepack enable
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN pnpm build

FROM node:20-alpine AS run
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
RUN addgroup -S ingon && adduser -S ingon -G ingon
COPY --from=build --chown=ingon:ingon /app/.next/standalone ./
COPY --from=build --chown=ingon:ingon /app/.next/static ./.next/static
COPY --from=build --chown=ingon:ingon /app/public ./public
USER ingon
EXPOSE 3000
# Pass secrets at runtime:  docker run --env-file .env.local -p 3000:3000 ingon
CMD ["node", "server.js"]
