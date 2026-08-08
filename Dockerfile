# =====================================================
# Stage 1 - Install Frontend Dependencies
# =====================================================
FROM node:20-alpine AS frontend-deps

WORKDIR /app/frontend

COPY frontend/package*.json ./

RUN npm ci

# =====================================================
# Stage 2 - Build Frontend
# =====================================================
FROM node:20-alpine AS frontend-builder

WORKDIR /app/frontend

COPY --from=frontend-deps /app/frontend/node_modules ./node_modules

COPY frontend/ .

ARG API_PROXY_TARGET
ENV API_PROXY_TARGET=${API_PROXY_TARGET}

RUN npm run build

# =====================================================
# Stage 3 - Install Backend Dependencies
# =====================================================
FROM node:20-alpine AS backend-deps

WORKDIR /app/backend

COPY backend/package*.json ./

RUN npm ci --omit=dev

# =====================================================
# Stage 4 - Production Image
# =====================================================
FROM node:20-alpine

WORKDIR /app

ENV NODE_ENV=production

RUN apk add --no-cache bash

# ===========================
# Backend
# ===========================

COPY --from=backend-deps /app/backend/node_modules ./backend/node_modules

COPY backend ./backend

WORKDIR /app/backend

RUN npx prisma generate

WORKDIR /app

# ===========================
# Frontend
# ===========================

COPY --from=frontend-builder /app/frontend/.next/standalone ./frontend

COPY --from=frontend-builder /app/frontend/.next/static ./frontend/.next/static

COPY --from=frontend-builder /app/frontend/public ./frontend/public

# ===========================
# Startup Script
# ===========================

COPY start.sh /start.sh

RUN chmod +x /start.sh

# ===========================
# Ports
# ===========================

EXPOSE 3000
EXPOSE 5000

HEALTHCHECK --interval=30s --timeout=10s --start-period=30s \
CMD wget -qO- http://127.0.0.1:3000 || exit 1

CMD ["/start.sh"]