FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including dev dependencies needed for build)
RUN npm ci

# Copy source code
COPY . .

# Build TypeScript and generate Prisma client
RUN npm run build
RUN npx prisma generate

EXPOSE 3000

CMD ["npm", "start"]