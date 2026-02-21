FROM node:20-alpine

WORKDIR /app

RUN apk add --no-cache python3 make g++ pkgconfig openssl openssl-dev vips-dev ffmpeg --repository=https://dl-cdn.alpinelinux.org/alpine/edge/community --repository=https://dl-cdn.alpinelinux.org/alpine/edge/main

ENV PRISMA_ENGINES_MIRROR=https://binaries.prisma.sh

COPY package*.json ./
RUN npm install --omit=dev

COPY prisma ./prisma/
RUN npx prisma generate

COPY src ./src/

RUN mkdir -p /app/uploads

EXPOSE 4000

CMD ["sh", "-c", "npx prisma migrate deploy && node prisma/seed.js && node prisma/seed-transport.js && node src/index.js"]
