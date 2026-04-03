# Stage 1 — build with Node 20 Debian to avoid Prisma/engine issues
FROM node:20-bullseye AS build
WORKDIR /app

# Install build tools needed by some packages
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 build-essential ca-certificates git \
  && rm -rf /var/lib/apt/lists/*

# Copy lockfile first for caching
COPY package*.json ./
COPY package-lock.json ./

# Ensure dev deps are installed so prisma and build tools are available
ENV NODE_ENV=development
ENV NPM_CONFIG_LEGACY_PEER_DEPS=true

RUN npm ci

# Copy source and run prisma generate and build
COPY . .
# Run prisma generate explicitly so it fails here with full logs if something is wrong
RUN npx prisma generate

# If your project has a build step (Next, etc.), run it
# Adjust or remove if not applicable
RUN npm run build || true

# Stage 2 — runtime
FROM node:20-bullseye AS runtime
WORKDIR /app
ENV NODE_ENV=production

# Copy only what runtime needs
COPY --from=build /app/package*.json ./
COPY --from=build /app/node_modules ./node_modules
# Copy built output and public/static files as needed
COPY --from=build /app/.next ./.next
COPY --from=build /app/public ./public
COPY --from=build /app/next.config.js ./
COPY --from=build /app/prisma ./prisma

EXPOSE 3000
CMD ["npm", "start"]
