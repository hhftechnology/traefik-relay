# TraefikRelay

TraefikRelay lets homelab users link Traefik instances on different hosts to a main, public-facing Traefik instance without using Docker Swarm or publishing ports.

## How It Works

TraefikRelay connects multiple Traefik instances by:

1. Using Traefik's API on local instances to discover registered routes
2. Publishing these routes to Redis, which the main Traefik instance reads as a provider
3. Mapping entry points between instances to maintain proper routing

This approach lets you expose services from multiple hosts through a single public-facing Traefik instance, while keeping your internal network secure.

## Requirements

- A main Traefik instance configured with Redis provider
- One or more local Traefik instances with API access enabled
- Redis server accessible by both TraefikRelay and the main Traefik instance

## Installation

### Using Docker (recommended)

```bash
docker pull ghcr.io/hhftechnology/traefik-relay:latest
```

### Building from source

```bash
# Clone the repository
git clone https://github.com/hhftechnology/traefik-relay.git
cd traefik-relay

# Build the binary
go build -o traefik-relay ./cmd/traefik-relay

# Run the application
./traefik-relay --config=/path/to/config.yml
```

## Configuration

### Main Traefik Instance

Configure your main Traefik instance to use the Redis provider in `traefik.yml`:

```yaml
providers:
  redis:
    endpoints:
      - "redis:6379" # Change if Redis is not available on localhost
```

HTTPS should be configured on this instance.

### Local Traefik Instances

Enable API access in your local Traefik instances' `traefik.yml`:

```yaml
api:
  insecure: true # Only use within your local network
```

For local instances accessible from the internet, enable API with Basic Auth instead:

```yaml
api:
  dashboard: true
```

And add a router with authentication middleware.

### TraefikRelay Configuration

Create a `config.yml` file:

```yaml
# Global settings
runEvery: 60 # Check for changes every 60 seconds
forwardMiddlewares: true
forwardServices: true

# Servers configuration
servers:
  - name: "compute-1"
    apiAddress: http://192.168.0.10:8080
    destinationAddress: http://192.168.0.10
    entryPoints:
      web: web
      web-secure: web
```

#### Environment Variables

- `REDIS_URL`: Redis connection string (default: `redis:6379`)
- `CONFIG_PATH`: Path to config file (default: `/config.yml`)
- `RUN_EVERY`: Polling interval in seconds (default: `60`)

## Docker Compose Example

```yaml
version: "3"

networks:
  default:
    name: "web"

services:
  traefik:
    image: traefik:latest
    ports:
      - 80:80
      - 443:443
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock:ro
      - ./traefik.yml:/traefik.yml:ro
      - ./certs/acme.json:/acme.json

  traefik-relay:
    image: ghcr.io/hhftechnology/traefik-relay:latest
    volumes:
      - ./config.yml:/config.yml
    environment:
      REDIS_URL: "redis:6379"

  redis:
    image: redis:alpine
```

## Configuration Options

### Server Configuration

| Option               | Description                                     | Default            |
| -------------------- | ----------------------------------------------- | ------------------ |
| `name`               | Unique name for the server                      | (required)         |
| `apiAddress`         | URL of the Traefik API (can include Basic Auth) | (required)         |
| `apiHost`            | Custom host header for API requests             | (empty)            |
| `destinationAddress` | URL where traffic should be directed            | (required)         |
| `entryPoints`        | Mapping of main to local entrypoints            | `{"http": "http"}` |
| `forwardMiddlewares` | Whether to forward middleware references        | (global setting)   |
| `forwardServices`    | Whether to forward service references           | (global setting)   |

### EntryPoints Mapping

The `entryPoints` mapping works as follows:

- Left side: entrypoints on your main Traefik instance
- Right side: entrypoints on the local instance

Example:

```yaml
entryPoints:
  web: local-http # Map main 'web' to local 'local-http'
  web-secure: local-http # Map main 'web-secure' to local 'local-http'
```

## Advanced Features

### Forwarding Services

TraefikRelay can identify if your internal router references a service not defined in the internal Traefik instance. For example:

```yaml
services:
  whoami:
    labels:
      traefik.http.routers.whoami-auth.service: "authentik@file"
```

It will look for the `authentik@file` service in the main instance.

### Forwarding Middlewares

TraefikRelay can forward middleware usage from internal instances to the main instance. This is enabled by the `forwardMiddlewares` property in the configuration.

This means that middleware dependencies from local routers will be brought to the main instance, which will be responsible for finding them.

## Security Considerations

- Only use `insecure: true` for API access within your local network
- For publicly accessible instances, always use proper authentication
- Consider using Docker networks to isolate containers

## License

MIT License - See LICENSE file for details.
