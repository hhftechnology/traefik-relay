# Stage 1: Build the UI
FROM node:20-alpine AS ui-builder

WORKDIR /app

# Copy package.json and package-lock.json first for better caching
COPY traefik-relay-ui/package*.json ./

# Use npm ci for more reliable builds (ensures exact versions from package-lock)
RUN npm ci

# Copy the UI source code
COPY traefik-relay-ui/ ./

# Fix the source file references in the HTML to ensure Vite can properly process them
# This changes /src/index.tsx to ./src/index.tsx for proper resolution
RUN sed -i 's|src="/src/index.tsx"|src="./src/index.tsx"|g' public/index.html

# Set production mode for optimal build
ENV NODE_ENV=production

# Build the UI
RUN npm run build

# Verify the build succeeded by checking for asset files and correct HTML references
RUN test -d dist/assets && \
    grep -q "assets/" dist/index.html || \
    (echo "UI BUILD FAILED - ASSETS NOT GENERATED CORRECTLY" && exit 1)

# Stage 2: Build the Go backend
FROM golang:1.21-alpine AS go-builder

WORKDIR /src

# Copy go.mod and go.sum files
COPY go.mod go.sum* ./
RUN go mod download

# Copy the source code
COPY . .

# Build the application
RUN CGO_ENABLED=0 GOOS=linux go build -o /traefik-relay ./cmd/traefik-relay

# Stage 3: Final image
FROM alpine:3.18

# Add necessary CA certificates for HTTPS
RUN apk --no-cache add ca-certificates && update-ca-certificates

# Set environment variables
ENV CONFIG_PATH=/config.yml \
    REDIS_URL=redis:6379 \
    RUN_EVERY=60 \
    ENABLE_API=true \
    API_PORT=8080

# Create directories
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