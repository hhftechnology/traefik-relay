package worker

import (
	"context"
	"fmt"
	"log"
	"strings"

	"github.com/hhftechnology/traefik-relay/internal/config"
	"github.com/hhftechnology/traefik-relay/internal/redis"
	"github.com/hhftechnology/traefik-relay/internal/traefik"
)

// Worker handles the synchronization between Traefik instances
type Worker struct {
	config      *config.Config
	redisClient *redis.Client
	oldEntries  map[string]string
}

// New creates a new worker
func New(cfg *config.Config, redisClient *redis.Client) *Worker {
	return &Worker{
		config:      cfg,
		redisClient: redisClient,
		oldEntries:  make(map[string]string),
	}
}

// Execute fetches configurations from all Traefik instances and updates Redis
func (w *Worker) Execute(ctx context.Context) error {
	log.Printf("Worker running at: %s", ctx.Value("time"))

	// Store current entries to keep track of what should be removed later
	entries := make(map[string]string)

	// Process each server
	for _, server := range w.config.Servers {
		if err := w.processServer(ctx, server, entries); err != nil {
			log.Printf("Error processing server '%s': %v", server.Name, err)
			// Continue with other servers even if one fails
			continue
		}
	}

	// Find keys to remove (those that were in oldEntries but not in new entries)
	var keysToRemove []string
	for key := range w.oldEntries {
		if _, exists := entries[key]; !exists {
			keysToRemove = append(keysToRemove, key)
		}
	}

	// Remove old keys from Redis
	if len(keysToRemove) > 0 {
		if err := w.redisClient.DeleteKeys(ctx, keysToRemove); err != nil {
			log.Printf("Error deleting old keys: %v", err)
		}
	}

	// Update Redis with new entries
	if err := w.redisClient.StoreEntries(ctx, entries); err != nil {
		log.Printf("Error storing entries in Redis: %v", err)
		return err
	}

	// Update oldEntries for the next run
	w.oldEntries = entries

	return nil
}

// processServer processes a single server and adds its entries to the provided map
func (w *Worker) processServer(ctx context.Context, server config.Server, entries map[string]string) error {
	// Create a Traefik client for this server
	client := traefik.NewClient(&server)

	// Set up the destination service in Redis
	entries[getRedisKey("http", "services", server.Name, "loadbalancer", "servers", "0", "url")] = server.DestinationAddress
	entries[getRedisKey("tcp", "services", server.Name, "loadbalancer", "servers", "0", "url")] = server.DestinationAddress

	// Process HTTP routers
	if err := w.processHttpRouters(ctx, client, server, entries); err != nil {
		log.Printf("Error processing HTTP routers for server '%s': %v", server.Name, err)
	}

	// Process TCP routers
	if err := w.processTcpRouters(ctx, client, server, entries); err != nil {
		log.Printf("Error processing TCP routers for server '%s': %v", server.Name, err)
	}

	return nil
}

// processHttpRouters processes HTTP routers for a server
func (w *Worker) processHttpRouters(ctx context.Context, client *traefik.Client, server config.Server, entries map[string]string) error {
	// Fetch HTTP routers
	routers, err := client.GetHttpRouters(ctx)
	if err != nil {
		return err
	}

	log.Printf("Retrieved %d HTTP routers from server '%s'", len(routers), server.Name)

	// If no routers, nothing to do
	if len(routers) == 0 {
		return nil
	}

	// Fetch middlewares and services for this server if needed
	var middlewareNames []string
	var serviceNames []string

	if server.GetServerForwardMiddlewares(w.config.ForwardMiddlewares) {
		middlewares, err := client.GetMiddlewares(ctx)
		if err != nil {
			log.Printf("Error fetching middlewares for server '%s': %v", server.Name, err)
		} else {
			for _, m := range middlewares {
				middlewareNames = append(middlewareNames, m.Name)
			}
		}
	}

	if server.GetServerForwardServices(w.config.ForwardServices) {
		services, err := client.GetServices(ctx)
		if err != nil {
			log.Printf("Error fetching services for server '%s': %v", server.Name, err)
		} else {
			for _, s := range services {
				serviceNames = append(serviceNames, s.Name)
			}
		}
	}

	// Process each router
	for _, router := range routers {
		routerName := router.Name
		
		// Handle routers with provider (e.g. "router@provider")
		if strings.Contains(routerName, "@") {
			parts := strings.SplitN(routerName, "@", 2)
			routerName = parts[0] + "_" + server.Name
		}

		// Check if this router uses any of our entrypoints
		var registeredEntryPoints int
		for globalEP, localEP := range server.EntryPoints {
			for _, routerEP := range router.EntryPoints {
				if routerEP == localEP {
					entries[getRedisKey("http", "routers", routerName, "entrypoints", itoa(registeredEntryPoints))] = globalEP
					registeredEntryPoints++
				}
			}
		}

		// Only continue if this router is using our entrypoints
		if registeredEntryPoints > 0 {
			entries[getRedisKey("http", "routers", routerName, "rule")] = router.Rule
			entries[getRedisKey("http", "routers", routerName, "service")] = server.Name

			// Handle forwarding of services
			if server.GetServerForwardServices(w.config.ForwardServices) {
				shouldUseOriginalService := true
				
				for _, svcName := range serviceNames {
					if strings.EqualFold(svcName, router.Name) || strings.EqualFold(svcName, router.Service) {
						shouldUseOriginalService = false
						break
					}
				}

				if shouldUseOriginalService {
					entries[getRedisKey("http", "routers", routerName, "service")] = router.Service
				}
			}

			// Handle forwarding of middlewares
			if server.GetServerForwardMiddlewares(w.config.ForwardMiddlewares) && len(router.Middlewares) > 0 {
				for i, middleware := range router.Middlewares {
					shouldForward := true
					
					for _, mwName := range middlewareNames {
						if strings.EqualFold(mwName, middleware) {
							shouldForward = false
							break
						}
					}

					if shouldForward {
						entries[getRedisKey("http", "routers", routerName, "middlewares", itoa(i))] = middleware
					}
				}
			}
		}
	}

	return nil
}

// processTcpRouters processes TCP routers for a server
func (w *Worker) processTcpRouters(ctx context.Context, client *traefik.Client, server config.Server, entries map[string]string) error {
	// Fetch TCP routers
	routers, err := client.GetTcpRouters(ctx)
	if err != nil {
		return err
	}

	log.Printf("Retrieved %d TCP routers from server '%s'", len(routers), server.Name)

	// If no routers, nothing to do
	if len(routers) == 0 {
		return nil
	}

	// Process each router
	for _, router := range routers {
		serviceName := router.Service
		
		// Handle services with provider (e.g. "service@provider")
		if strings.Contains(serviceName, "@") {
			parts := strings.SplitN(serviceName, "@", 2)
			serviceName = parts[0] + "_" + server.Name
		}

		// Check if this router uses any of our entrypoints
		var registeredEntryPoints int
		for globalEP, localEP := range server.EntryPoints {
			for _, routerEP := range router.EntryPoints {
				if routerEP == localEP {
					entries[getRedisKey("tcp", "routers", serviceName, "entrypoints", itoa(registeredEntryPoints))] = globalEP
					registeredEntryPoints++
				}
			}
		}

		// Only continue if this router is using our entrypoints
		if registeredEntryPoints > 0 {
			entries[getRedisKey("tcp", "routers", serviceName, "rule")] = router.Rule
			entries[getRedisKey("tcp", "routers", serviceName, "service")] = server.Name
		}
	}

	return nil
}

// getRedisKey joins multiple segments into a Redis key with the Traefik prefix
func getRedisKey(segments ...string) string {
	return "traefik/" + strings.Join(segments, "/")
}

// itoa converts an integer to a string
func itoa(i int) string {
	return fmt.Sprintf("%d", i)
}