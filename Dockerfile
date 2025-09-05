# Stage 1: Build NestJS
FROM node:18-alpine AS builder

WORKDIR /usr/src/app

# Copy dependency file
COPY package.json yarn.lock ./

# Install dependencies
RUN yarn install --frozen-lockfile

# Copy source code
COPY . .

# Generate Prisma Client
RUN npx prisma generate

# Build NestJS
RUN yarn build

# Stage 2: Production image
FROM node:18-alpine AS production

WORKDIR /usr/src/app

# Copy only necessary files from builder
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile --production

COPY --from=builder /usr/src/app/dist ./dist
COPY --from=builder /usr/src/app/prisma ./prisma

# Prisma needs client at runtime
RUN npx prisma generate

# Expose NestJS port
EXPOSE 4002

# Start production
CMD ["yarn", "start:prod"]
