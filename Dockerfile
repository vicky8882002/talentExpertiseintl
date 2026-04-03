# Dockerfile (paste at repo root)
# Use Node 20 for modern packages
FROM node:20-bullseye

WORKDIR /app

# Install pnpm via corepack (ensures pnpm version matches lockfile)
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy package files first for caching
COPY package.json pnpm-lock.yaml ./

# Use BuildKit cache mount when available (optional but speeds CI)
# The RUN line below works with Docker BuildKit; Coolify's builder supports BuildKit.
RUN --mount=type=cache,id=pnpm-store,target=/root/.local/share/pnpm/store/v3 \
    pnpm install --frozen-lockfile

# Copy source and build
COPY . .
RUN pnpm run build || true

EXPOSE 3000
CMD ["pnpm", "start"]
