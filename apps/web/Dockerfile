FROM node:22-bookworm-slim AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PNPM_HOME/bin:$PATH"
RUN corepack enable

FROM base AS builder
WORKDIR /app

RUN pnpm add -g turbo@^2
COPY . .

# Create partial monorepo for server in out/
RUN turbo prune @repo/web --docker


FROM base AS installer
WORKDIR /app


COPY --from=builder /app/out/json/ .
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile

COPY --from=builder /app/out/full .

# Vite uses quite a lot of memory while building
ENV NODE_OPTIONS="--max-old-space-size=8192"
ENV GENERATE_SOURCEMAP=false

ENV NODE_ENV=production

ENV VITE_APP_NAME="DSA Doku"

ENV VITE_APP_SHORT_NAME="DSA Doku"

ENV VITE_APP_BACKGROUND_COLOR=#fff

ENV VITE_APP_THEME_COLOR=#00858c

ENV VITE_APP_THEME_COLOR_FOREGROUND=#fff

ARG VITE_API_BASE_URL
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

RUN pnpm turbo run build

FROM nginx
WORKDIR /app

COPY ./apps/web/nginx/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=installer /app/apps/web/dist /usr/share/nginx/html
