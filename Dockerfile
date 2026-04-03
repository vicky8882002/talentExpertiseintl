# Stage 1 — build (Node 20 Debian)
FROM node:20-bullseye AS build
WORKDIR /app

# system deps needed by Prisma and native modules
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 build-essential ca-certificates git \
  && rm -rf /var/lib/apt/lists/*

# copy package files for caching
COPY package*.json ./
COPY package-lock.json ./

# install all deps (dev included) so prisma is available
ENV NODE_ENV=development
ENV NPM_CONFIG_LEGACY_PEER_DEPS=true
# prevent automatic postinstall from running (we'll run it explicitly)
ENV PRISMA_GENERATE=false

RUN npm ci

# copy source, run prisma generate explicitly and build
COPY . .
RUN npx prisma generate
RUN npm run build || true

# Stage 2 — runtime
FROM node:20-bullseye AS runtime
WORKDIR /app
ENV NODE_ENV=production

COPY --from=build /app/package*.json ./
COPY --from=build /app/node_modules ./node_modules
# adjust these if not Next.js
COPY --from=build /app/.next ./.next
COPY --from=build /app/public ./public
COPY --from=build /app/prisma ./prisma

EXPOSE 3000
CMD ["npm", "start"]
