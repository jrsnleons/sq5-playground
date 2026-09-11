# Build Stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy root workspace files
COPY package*.json ./
COPY packages/hardware-profiles/package*.json ./packages/hardware-profiles/
COPY packages/simulation-core/package*.json ./packages/simulation-core/
COPY apps/foh-sim-web/package*.json ./apps/foh-sim-web/

# Install dependencies across all workspaces
RUN npm ci

# Copy entire source tree
COPY . .

# Run validation checks and production build
RUN npm run typecheck
RUN npm run test
RUN npm run build

# Production Runtime Stage
FROM nginx:alpine AS runner

# Remove default nginx static assets
RUN rm -rf /usr/share/nginx/html/*

# Copy built web application from builder stage
COPY --from=builder /app/apps/foh-sim-web/dist /usr/share/nginx/html

# Copy custom Nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
