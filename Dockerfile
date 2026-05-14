FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/scripts ./scripts
COPY --from=builder /app/node_modules ./node_modules
RUN mkdir -p /var/spool/cron/crontabs && \
    echo "*/15 * * * * cd /app && npx tsx scripts/backfill-embeddings.ts >> /var/log/backfill.log 2>&1" \
    > /var/spool/cron/crontabs/root && \
    chmod 0600 /var/spool/cron/crontabs/root
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
ENTRYPOINT ["/docker-entrypoint.sh"]
