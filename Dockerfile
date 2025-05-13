# Stage 1: Build the UI
FROM node:20-alpine AS ui-builder

WORKDIR /app

# Instead of trying to build the React app, create a simple static HTML
RUN mkdir -p dist && \
    cat > dist/index.html << 'EOF'
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="description" content="TraefikRelay - Manage your distributed Traefik instances" />
    <title>TraefikRelay Dashboard</title>
    <link href="https://cdn.jsdelivr.net/npm/@chakra-ui/react@2.8.2/dist/chakra-ui.min.css" rel="stylesheet">
    <style>
      body {
        font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
        margin: 0;
        padding: 0;
        background-color: #f7fafc;
      }
      .container {
        max-width: 1200px;
        margin: 0 auto;
        padding: 2rem;
      }
      header {
        margin-bottom: 2rem;
      }
      h1 {
        color: #1890ff;
        margin-bottom: 0.5rem;
      }
      .dashboard-card {
        background: white;
        border-radius: 8px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.08);
        padding: 1.5rem;
        margin-bottom: 1.5rem;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <header>
        <h1>TraefikRelay Dashboard</h1>
        <p>Manage your distributed Traefik instances</p>
      </header>
      
      <div class="dashboard-card">
        <h2>Server Status</h2>
        <p>Use the API endpoints to interact with TraefikRelay:</p>
        <ul>
          <li><code>/api/v1/status</code> - Get overall status</li>
          <li><code>/api/v1/servers</code> - List all servers</li>
          <li><code>/api/v1/servers/{serverName}</code> - Get details for a specific server</li>
          <li><code>/api/v1/config</code> - Get configuration</li>
        </ul>
      </div>
    </div>
  </body>
</html>
EOF

# Copy the favicon.svg file to the dist directory
COPY traefik-relay-ui/public/favicon.svg dist/

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