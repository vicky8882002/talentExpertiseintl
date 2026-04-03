FROM node:20-bullseye
WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends python3 build-essential git && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
COPY package-lock.json ./

ENV NODE_ENV=development
ENV NPM_CONFIG_LEGACY_PEER_DEPS=true

RUN npm ci

COPY . .
RUN npx prisma generate
RUN npm run build || true

ENV NODE_ENV=production
EXPOSE 3000
CMD ["npm", "start"]
