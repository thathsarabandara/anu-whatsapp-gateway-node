# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Prune dev dependencies for production
RUN npm prune --production

# Production stage
FROM node:18-alpine

WORKDIR /app

# Install dumb-init to handle signals properly and curl for health checks
RUN apk add --no-cache dumb-init curl

# Copy from builder
COPY --from=builder /app/node_modules ./node_modules

# Copy application code
COPY . .

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 && \
    chown -R nodejs:nodejs /app

USER nodejs

# Expose port
EXPOSE 3000

# Set environment variables for production
ENV NODE_ENV=production

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:3000/api/health || exit 1

# Metadata labels
LABEL org.opencontainers.image.title="WhatsApp Gateway API" \
      org.opencontainers.image.description="WhatsApp Gateway Node.js Application" \
      org.opencontainers.image.version="1.0.0" \
      org.opencontainers.image.authors="Thathsara Bandara"

# Use dumb-init to run the app
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "src/server.js"]
