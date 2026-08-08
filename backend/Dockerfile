FROM node:20-bullseye-slim

WORKDIR /app

# Install runtime dependencies required by Prisma (Postgres client)
RUN apt-get update && apt-get install -y libpq5 ca-certificates --no-install-recommends \
  && rm -rf /var/lib/apt/lists/*

# Copy package manifests and install dependencies
COPY backend/package*.json ./
RUN npm install

# Copy source files
COPY backend/ ./

# Generate Prisma client
RUN npx prisma generate

ENV NODE_ENV=production
EXPOSE 5000

CMD ["node", "src/index.js"]
