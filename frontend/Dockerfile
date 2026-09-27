FROM node:20-bullseye-slim

WORKDIR /app

ARG API_PROXY_TARGET=http://127.0.0.1:5000
ENV API_PROXY_TARGET=${API_PROXY_TARGET}

# Install dependencies
COPY frontend/package*.json ./
RUN npm install

# Copy source and build
COPY frontend/ ./
RUN npm run build

ENV NODE_ENV=production
EXPOSE 3000

CMD ["npm", "run", "start"]
