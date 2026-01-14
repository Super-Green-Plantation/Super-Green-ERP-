FROM node:22-slim

WORKDIR /app

# Enable pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Install OpenSSL (required by Prisma)
RUN apt-get update && apt-get install -y openssl \
  && rm -rf /var/lib/apt/lists/*

# Copy lockfiles first
COPY package.json pnpm-lock.yaml ./

RUN pnpm install --frozen-lockfile

# Copy prisma schema
COPY prisma ./prisma

# Generate Prisma Client
RUN pnpm prisma generate

# Copy rest of the app
COPY . .

EXPOSE 3000

CMD ["pnpm", "dev"]
