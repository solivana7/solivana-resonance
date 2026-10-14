# SoliVana Resonance — Vite SPA + tiny Express proxy on Railway.
# Multi-stage: builder compiles the SPA, runner serves dist/ and exposes
# POST /api/lead which forwards to GHL contacts/upsert.

FROM node:20-alpine AS builder
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci --no-audit --no-fund

COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# Only ship runtime deps (express + compression) — no dev/build tooling.
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev --no-audit --no-fund

COPY --from=builder /app/dist ./dist
COPY server.js ./server.js

EXPOSE 8080
CMD ["node", "server.js"]
