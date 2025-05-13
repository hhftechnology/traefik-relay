# Build UI stage
FROM node:18-alpine AS ui-builder

# Set working directory
WORKDIR /ui-build

# First copy just package files for better caching
COPY traefik-relay-ui/package*.json ./

# Install dependencies - including Vite explicitly
RUN npm install
RUN npm install -g vite

# Now copy the entire UI directory
COPY traefik-relay-ui/ ./

# Debug: Show directory structure
RUN echo "=== Root directory contents ==="
RUN ls -la
RUN echo "=== Node modules ==="
RUN ls -la node_modules | head -n 10
RUN echo "=== Package.json content ==="
RUN cat package.json

# Ensure index.html exists in the right place
RUN echo "=== Checking for index.html ==="
RUN find . -name "index.html" -type f

# Create a minimal index.html if it doesn't exist
RUN if ! find . -name "index.html" -type f | grep -q .; then \
    echo "Creating minimal index.html"; \
    echo '<!DOCTYPE html><html><head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /><title>TraefikRelay</title></head><body><div id="root"></div><script type="module" src="/src/index.js"></script></body></html>' > index.html; \
fi

# Create a minimal but functional vite.config.js
RUN echo "import { defineConfig } from 'vite';" > vite.config.js
RUN echo "import react from '@vitejs/plugin-react';" >> vite.config.js
RUN echo "export default defineConfig({" >> vite.config.js
RUN echo "  plugins: [react()]," >> vite.config.js
RUN echo "  build: { outDir: 'dist' }," >> vite.config.js
RUN echo "});" >> vite.config.js

# Show the contents of the vite.config.js file
RUN echo "=== Vite config content ==="
RUN cat vite.config.js

# Attempt to build with explicit commands
RUN echo "=== Building UI with Vite ==="
RUN mkdir -p dist
RUN NODE_ENV=production vite build --outDir dist

# Show build output
RUN echo "=== Build output ==="
RUN ls -la dist

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
RUN mkdir -p /app/ui/dist

# Copy the binary from the Go build stage
COPY --from=go-builder /traefik-relay /usr/local/bin/traefik-relay

# Copy the UI from the UI build stage
COPY --from=ui-builder /ui-build/dist/ /app/ui/dist/

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