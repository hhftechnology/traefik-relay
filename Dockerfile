# Build UI stage
FROM node:18-alpine AS ui-builder
WORKDIR /app

# Copy package manifests first for better caching
COPY traefik-relay-ui/package.json traefik-relay-ui/package-lock.json* ./

# Install dependencies
RUN npm install

# Copy ALL UI files at once to maintain correct relative paths
COPY traefik-relay-ui/ ./

# Debug: show important file locations
RUN echo "--- Root directory contents ---"
RUN ls -la ./
RUN echo "--- Public directory contents ---"
RUN ls -la ./public || echo "No public directory"
RUN echo "--- Src directory contents ---"
RUN ls -la ./src || echo "No src directory"

# Important: Make sure index.html exists (for Vite)
RUN if [ ! -f "index.html" ]; then \
    echo "index.html not found in root, checking public directory"; \
    if [ -f "public/index.html" ]; then \
      echo "Found in public, copying to root"; \
      cp public/index.html ./; \
    fi; \
fi

# Verify the crucial index.html exists
RUN ls -la index.html || echo "WARNING: index.html still missing"

# Create specific vite.config.js that will work in Docker environment
RUN echo 'import { defineConfig } from "vite"; import react from "@vitejs/plugin-react"; export default defineConfig({ plugins: [react()], build: { outDir: "dist" } });' > vite.config.js

# Build the UI
RUN npm run build

# Debug: verify build output
RUN echo "--- Contents of build output ---"
RUN ls -la dist/

# Build Go stage
FROM golang:1.21-alpine AS go-builder
WORKDIR /src

# Copy go.mod and go.sum files
COPY go.mod go.sum* ./
RUN go mod download

# Copy the source code
COPY . .

# Build the application
RUN CGO_ENABLED=0 GOOS=linux go build -o /traefik-relay ./cmd/traefik-relay

# Final stage
FROM alpine:3.18

# Add necessary CA certificates for HTTPS
RUN apk --no-cache add ca-certificates && update-ca-certificates

# Set environment variables
ENV CONFIG_PATH=/config.yml \
    REDIS_URL=redis:6379 \
    RUN_EVERY=60 \
    ENABLE_API=true \
    API_PORT=8080

# Create necessary directories
RUN mkdir -p /app/ui

# Copy the binary from the Go build stage
COPY --from=go-builder /traefik-relay /usr/local/bin/traefik-relay

# Copy the UI from the UI build stage
COPY --from=ui-builder /app/dist /app/ui/dist

# Create a non-root user and group
RUN addgroup -S traefikrelay && adduser -S traefikrelay -G traefikrelay && \
    chown -R traefikrelay:traefikrelay /app

# Switch to non-root user
USER traefikrelay

# Set the working directory
WORKDIR /app

# Expose the API port
EXPOSE 8080

# Set the entrypoint
ENTRYPOINT ["traefik-relay"]