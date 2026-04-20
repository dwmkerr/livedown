# Stage 1: builder — install deps and compile TypeScript
FROM node:lts-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Stage 2: runtime — lean production image
FROM node:lts-alpine AS runtime

WORKDIR /app

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY package.json ./

# /data is the conventional mount point for user files
RUN mkdir /data

ENTRYPOINT ["node", "dist/cli.js"]
