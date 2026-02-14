# Stage 1: Build frontend
FROM node:20-alpine AS frontend-builder

WORKDIR /app

COPY frontend/package*.json ./
RUN npm install

COPY frontend/ .
RUN npm run build

# Stage 2: Nginx with custom config + frontend files
FROM nginx:1.25-alpine

RUN rm /etc/nginx/conf.d/default.conf

COPY nginx/nginx.conf /etc/nginx/nginx.conf
COPY --from=frontend-builder /app/dist /var/www/html

RUN mkdir -p /var/www/uploads

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
