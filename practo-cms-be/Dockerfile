FROM node:18

# Debian-based image has better Prisma compatibility
# No need to install OpenSSL separately - it's already included

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including dev dependencies needed for build)
RUN npm install

# Copy source code
COPY . .

# Generate Prisma client first (before build)
RUN npx prisma generate

# Build TypeScript
RUN npm run build

# Copy generated Prisma client to dist folder (TypeScript doesn't copy it)
RUN cp -r src/generated dist/generated || true

# Copy and set up entrypoint script for migrations
COPY docker-entrypoint.sh /app/docker-entrypoint.sh
RUN chmod +x /app/docker-entrypoint.sh

EXPOSE 3000

# Use entrypoint script to run migrations before starting
ENTRYPOINT ["/app/docker-entrypoint.sh"]