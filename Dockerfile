# Build UI stage
FROM node:18-alpine AS ui-builder

WORKDIR /app

# Copy package manifests first for better caching
COPY traefik-relay-ui/package.json traefik-relay-ui/package-lock.json* ./

# Install dependencies + the missing lucide-react package
RUN npm install

# Create the target directories for source and public files
RUN mkdir -p src public

# Copy contents of traefik-relay-ui/public into container's /app/public
COPY traefik-relay-ui/public/ ./public/

# Copy source files from traefik-relay-ui/src
COPY traefik-relay-ui/src/App.js ./src/
COPY traefik-relay-ui/src/index.js ./src/
COPY traefik-relay-ui/src/index.css ./src/

# Copy other configuration files needed for the build
COPY traefik-relay-ui/postcss.config.js ./
COPY traefik-relay-ui/tailwind.config.js ./

# Verify structure before building
RUN echo "--- Contents of /app/public ---"
RUN ls -la public
RUN echo "--- Contents of /app/src ---"
RUN ls -la src

# Build the UI with Create React App
RUN npm run build

# Verify build output
RUN echo "--- Contents of build ---"
RUN ls -la build/

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
# Note: Using /build since it's Create React App, not /dist which would be for Vite
COPY --from=ui-builder /app/build /app/ui/dist

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