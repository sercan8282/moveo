# Stage 1: Build frontend
FROM node:20-alpine AS frontend-builder

WORKDIR /app

COPY frontend/package*.json ./
RUN npm install

COPY frontend/ .

# Generate build info with timestamp
RUN echo "export const BUILD_INFO = { buildTime: '$(date '+%Y-%m-%d %H:%M:%S')', version: '1.0.0' };" > src/buildInfo.js

RUN npm run build

# Stage 2: Nginx with custom config + frontend files
FROM nginx:1.25-alpine

RUN rm /etc/nginx/conf.d/default.conf

# Copy config as template (will be processed with envsubst)
COPY nginx/nginx.conf /etc/nginx/nginx.conf.template
COPY --from=frontend-builder /app/dist /var/www/html

RUN mkdir -p /var/www/uploads

# Default backend host for docker-compose setup
ENV BACKEND_HOST=backend

EXPOSE 80

# Use envsubst to replace BACKEND_HOST, then start nginx
CMD ["/bin/sh", "-c", "envsubst '${BACKEND_HOST}' < /etc/nginx/nginx.conf.template > /etc/nginx/nginx.conf && nginx -g 'daemon off;'"]
