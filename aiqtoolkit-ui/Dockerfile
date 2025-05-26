FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
# Check https://github.com/nodejs/docker-node/tree/b4117f9333da4138b03a546ec926ef50a31506c3#nodealpine to understand why libc6-compat might be needed.
RUN apk add --no-cache libc6-compat

WORKDIR /app

# Copy package.json from the opensourcejs-ui directory
COPY ./aiqtoolkit/external/aiqtoolkit-opensource-ui/package.json ./
COPY ./aiqtoolkit/external/aiqtoolkit-opensource-ui/package-lock.json* ./

# Modify package.json to fix the name issue
RUN sed -i 's/"name": "[^"]*"/"name": "aiqtoolkit-ui"/g' package.json

# Install dependencies
RUN npm ci

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY ./aiqtoolkit/external/aiqtoolkit-opensource-ui/ ./

# Modify package.json to fix the name issue
RUN sed -i 's/"name": "[^"]*"/"name": "aiqtoolkit-ui"/g' package.json

# Build the application
RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
# Uncomment the following line in case you want to disable telemetry during runtime.
# ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public

# Set the correct permission for prerender cache
RUN mkdir -p .next
RUN chown nextjs:nodejs .next

# Automatically leverage output traces to reduce image size
# https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --from=builder --chown=nextjs:nodejs /app/next.config.js ./
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/package.json ./package.json

# Add environment setup script
COPY ./aiqtoolkit-ui/env-setup.sh ./
RUN chmod +x ./env-setup.sh

# Create .env.local directory and set permissions
RUN mkdir -p /app/.next
RUN touch /app/.env.local
RUN chown -R nextjs:nodejs /app/.next /app/.env.local

USER nextjs

EXPOSE 3000

ENV PORT 3000
# set hostname to localhost
ENV HOSTNAME "0.0.0.0"

# server.js is created by next build from the standalone output
# https://nextjs.org/docs/pages/api-reference/next-config-js/output
CMD ["sh", "-c", "./env-setup.sh && node server.js"]
