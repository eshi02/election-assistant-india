# Multi-stage build for smaller, more secure final image
FROM node:20-slim AS deps

WORKDIR /app

# Copy only package files for better layer caching
COPY package.json package-lock.json* ./

# Install only production dependencies
RUN npm ci --omit=dev

# --- Final stage ---
FROM node:20-slim

WORKDIR /app

# Run as non-root user (security best practice)
RUN groupadd --system --gid 1001 nodejs \
 && useradd --system --uid 1001 --gid nodejs nodejs

# Copy installed deps from previous stage
COPY --from=deps /app/node_modules ./node_modules

# Copy application source
COPY --chown=nodejs:nodejs package.json ./
COPY --chown=nodejs:nodejs src ./src

USER nodejs

# Cloud Run sets PORT env var; default to 8080
ENV PORT=8080
EXPOSE 8080

CMD ["node", "src/server.js"]