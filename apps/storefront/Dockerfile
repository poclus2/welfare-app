FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS builder
# Check https://github.com/nodejs/docker-node/tree/b4117f9333da4138b03a546ec926ef50a31506c3#nodealpine to understand why libc6-compat might be needed.
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Enable pnpm
RUN corepack enable

# Copy everything
COPY . .

# Install dependencies for the whole workspace
RUN pnpm install --frozen-lockfile

ARG NEXT_PUBLIC_MEDUSA_BACKEND_URL
ARG NEXT_PUBLIC_MEILISEARCH_HOST
ARG NEXT_PUBLIC_MEILISEARCH_API_KEY

ENV NEXT_PUBLIC_MEDUSA_BACKEND_URL=$NEXT_PUBLIC_MEDUSA_BACKEND_URL
ENV NEXT_PUBLIC_MEILISEARCH_HOST=$NEXT_PUBLIC_MEILISEARCH_HOST
ENV NEXT_PUBLIC_MEILISEARCH_API_KEY=$NEXT_PUBLIC_MEILISEARCH_API_KEY

# Next.js telemetry
ENV NEXT_TELEMETRY_DISABLED=1

WORKDIR /app/apps/storefront
# Run the build
RUN pnpm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app/apps/storefront

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Set the correct permission for prerender cache
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Automatically leverage output traces to reduce image size
# https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --from=builder --chown=nextjs:nodejs /app/apps/storefront/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/storefront/.next/static ./apps/storefront/.next/static
COPY --from=builder --chown=nextjs:nodejs /app/apps/storefront/public ./apps/storefront/public

USER nextjs

EXPOSE 3000

ENV PORT=3000

# server.js is created by next build from the standalone output
CMD ["node", "apps/storefront/server.js"]
