FROM node:22-alpine AS builder

WORKDIR /app
COPY package.json package-lock.json turbo.json ./
COPY apps/api/package.json apps/api/
COPY packages/ packages/
RUN npm ci --ignore-scripts

COPY apps/api apps/api
RUN npx prisma generate --schema=apps/api/prisma/schema.prisma
RUN npx prisma db push --schema=apps/api/prisma/schema.prisma --accept-data-loss 2>/dev/null || true
RUN npm run build --filter=@next-tickets/api

FROM node:22-alpine AS runner

WORKDIR /app
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nestjs

COPY --from=builder /app/apps/api/dist ./dist
COPY --from=builder /app/apps/api/prisma ./prisma
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/api/node_modules ./apps/api/node_modules

RUN mkdir -p /data && chown -R nestjs:nodejs /data

USER nestjs
EXPOSE 7860

ENV NODE_ENV=production
ENV PORT=7860
ENV FRONTEND_URL=https://next-tickets.vercel.app

HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:7860/api/auth/me || exit 1

CMD ["node", "dist/main.js"]
