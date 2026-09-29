# Build context: gốc monorepo  (docker compose -f infra/docker-compose.yml ...)
FROM node:22-bookworm-slim
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/* && corepack enable
WORKDIR /repo

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json ./
# package.json của mọi workspace để pnpm khớp lockfile
COPY apps/web/package.json ./apps/web/
COPY packages/api-client/package.json ./packages/api-client/
COPY apps/api ./apps/api
RUN pnpm install --frozen-lockfile --filter @share-car/api
RUN pnpm --filter @share-car/api build

WORKDIR /repo/apps/api
ENV NODE_ENV=production
EXPOSE 4000
# Áp migration rồi chạy API. Seed demo: docker compose exec api pnpm db:seed
CMD ["sh", "-c", "pnpm prisma migrate deploy && node dist/main.js"]
