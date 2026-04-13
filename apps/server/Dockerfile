FROM node:22-bookworm-slim AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

# make prisma happy
RUN apt-get update -y && apt-get install -y openssl

FROM base AS builder
WORKDIR /app

RUN pnpm add -g turbo@^2
COPY . .

# Create partial monorepo for server in out/
RUN turbo prune @repo/server --docker


FROM base AS installer
WORKDIR /app

COPY --from=builder /app/out/json/ .
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile

COPY --from=builder /app/out/full .

RUN pnpm turbo run build

FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

COPY --from=builder /app/out/json/ .
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --production --frozen-lockfile

# Copy build artifacts from dependencies
COPY --from=installer /app/packages/db/dist/ ./packages/db/dist/
COPY --from=installer /app/packages/db/prisma ./packages/db/prisma/
RUN pnpm --filter=@repo/db generate

COPY --from=installer /app/packages/trpc/dist/ ./packages/trpc/dist/

# Copy build artifacts from server application
COPY --from=installer /app/apps/server/dist/ ./apps/server/dist/

ENV PORT=3000
EXPOSE 3000

CMD ["pnpm", "backend:start"]
