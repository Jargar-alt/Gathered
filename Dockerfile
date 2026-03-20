# Build stage
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json tsconfig*.json vite.config.ts ./
RUN npm ci
COPY . .
RUN npm run build

# Production stage - serve static files with nginx
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf   # optional, add if needed
EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]
