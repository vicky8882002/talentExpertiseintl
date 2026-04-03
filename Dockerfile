FROM node:20-bullseye AS build
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends python3 build-essential git && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
COPY package-lock.json ./

ENV NODE_ENV=development
ENV NPM_CONFIG_LEGACY_PEER_DEPS=true
# prevent postinstall from running automatically (we'll run it explicitly)
ENV PRISMA_GENERATE=false

RUN npm ci

COPY . .
# run prisma generate explicitly now
RUN npx prisma generate
RUN npm run build || true

FROM node:20-bullseye AS runtime
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/package*.json ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/.next ./.next
COPY --from=build /app/public ./public
COPY --from=build /app/prisma ./prisma
EXPOSE 3000
CMD ["npm", "start"]
