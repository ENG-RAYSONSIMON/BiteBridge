FROM node:20-alpine AS base

WORKDIR /app

RUN apk add --no-cache openssl

COPY package*.json ./

FROM base AS development

RUN npm install

COPY . .

RUN DATABASE_URL="postgresql://postgres:postgres@localhost:5432/postgres?schema=public" npx prisma generate

EXPOSE 3000

CMD ["sh", "-c", "npx prisma migrate deploy && npm run dev"]

FROM base AS builder

RUN npm ci

COPY . .

RUN DATABASE_URL="postgresql://postgres:postgres@localhost:5432/postgres?schema=public" npx prisma generate
RUN npm run build

FROM base AS production

ENV NODE_ENV=production

RUN npm ci --omit=dev

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma.config.ts ./prisma.config.ts
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/node_modules/prisma ./node_modules/prisma
COPY --from=builder /app/node_modules/.bin/prisma ./node_modules/.bin/prisma

EXPOSE 3000

CMD ["sh", "-c", "npx prisma migrate deploy && npm start"]
