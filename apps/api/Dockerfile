# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Enable corepack for pnpm
RUN corepack enable

# Copy workspace configuration and lockfile
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY turbo.json ./

# Copy the API package
COPY apps/api ./apps/api

# Install dependencies (frozen lockfile for deterministic builds)
RUN pnpm install --frozen-lockfile

# Build the Medusa project
WORKDIR /app/apps/api
RUN pnpm run build

# Production stage
FROM node:20-alpine AS runner

WORKDIR /app

# Enable corepack
RUN corepack enable

# Copy built artifacts and necessary files from builder
COPY --from=builder /app/package.json ./
COPY --from=builder /app/pnpm-workspace.yaml ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/api/package.json ./apps/api/
COPY --from=builder /app/apps/api/node_modules ./apps/api/node_modules
COPY --from=builder /app/apps/api/.medusa ./apps/api/.medusa
COPY --from=builder /app/apps/api/medusa-config.js ./apps/api/

WORKDIR /app/apps/api

# Set production environment
ENV NODE_ENV=production

# Expose Medusa port
EXPOSE 9000

# Start Medusa server
CMD ["pnpm", "run", "start"]
