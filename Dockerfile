# Build stage
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json tsconfig*.json ./
RUN npm ci
COPY . .
RUN npm run build   # assumes your package.json has "build": "tsc" or similar

# Production stage
FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/package*.json ./
RUN npm ci --omit=dev
COPY --from=builder /app/dist ./dist   # adjust if your output dir is different (e.g. build/)
USER node
EXPOSE 8080
CMD ["node", "dist/index.js"]   # change to your entry file (e.g. dist/server.js)
