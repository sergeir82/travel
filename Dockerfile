#
# Production Docker image for Next.js
#

FROM node:20-alpine AS deps
WORKDIR /app

# Install dependencies first (better layer caching)
COPY package.json package-lock.json ./
RUN npm ci

FROM node:20-alpine AS builder
WORKDIR /app

ENV NODE_ENV=production

COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Create non-root user
RUN addgroup -S nextjs && adduser -S nextjs -G nextjs

# Install only production dependencies
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# Copy build output + assets
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
#
# Important:
# `next start` will try to load/transpile `next.config.ts` at runtime and requires the
# `typescript` package (devDependency). To keep the runtime image slim (prod deps only),
# we intentionally do NOT copy `next.config.ts` into the runner image.
#

COPY docker-entrypoint.sh /app/docker-entrypoint.sh
RUN chmod +x /app/docker-entrypoint.sh && chown -R nextjs:nextjs /app

USER nextjs
EXPOSE 3000

ENTRYPOINT ["/app/docker-entrypoint.sh"]
CMD ["npm", "run", "start"]

