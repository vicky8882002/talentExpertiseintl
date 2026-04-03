# Stage 1 — build
FROM node:20-alpine AS build
WORKDIR /app

# Install build tools
RUN apk add --no-cache python3 make g++ bash

# copy lockfile first for caching
COPY package*.json ./
COPY package-lock.json ./

# allow legacy peer deps if needed
ENV NPM_CONFIG_LEGACY_PEER_DEPS=true

# install all deps (including dev) so postinstall/prisma works
RUN npm ci

# copy source and run build (if you have a build step)
COPY . .
# run any build steps (adjust if your project uses next/build or similar)
RUN npm run build || true

# Stage 2 — runtime
FROM node:20-alpine AS runtime
WORKDIR /app

# copy only production deps and built files
ENV NODE_ENV=production
COPY --from=build /app/package*.json ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/.next ./.next
COPY --from=build /app/public ./public
COPY --from=build /app/next.config.js ./

EXPOSE 3000
CMD ["npm", "start"]
