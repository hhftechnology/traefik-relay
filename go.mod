module github.com/hhftechnology/traefik-relay

go 1.21

require (
	github.com/go-chi/chi/v5 v5.2.1
	github.com/go-chi/cors v1.2.1
	github.com/go-redis/redis/v8 v8.11.5
	gopkg.in/yaml.v3 v3.0.1
)

require (
	github.com/cespare/xxhash/v2 v2.1.2 // indirect
	github.com/dgryski/go-rendezvous v0.0.0-20200823014737-9f7001d12a5f // indirect
)

replace github.com/traefik/traefik/v3 => github.com/traefik/traefik/v3 v3.4.0
