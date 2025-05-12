package main

import (
	"context"
	"flag"
	"fmt"
	"log"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/hhftechnology/traefik-relay/internal/api"
	"github.com/hhftechnology/traefik-relay/internal/config"
	"github.com/hhftechnology/traefik-relay/internal/redis"
	"github.com/hhftechnology/traefik-relay/internal/worker"
)

func main() {
	// Define command line flags
	configPath := flag.String("config", getEnv("CONFIG_PATH", "/config.yml"), "Path to configuration file")
	redisURL := flag.String("redis", getEnv("REDIS_URL", "redis:6379"), "Redis URL")
	runEvery := flag.Int("run-every", getIntEnv("RUN_EVERY", 60), "Run every N seconds")
	apiPort := flag.Int("api-port", getIntEnv("API_PORT", 8080), "API server port")
	enableAPI := flag.Bool("enable-api", getBoolEnv("ENABLE_API", true), "Enable API server")
	flag.Parse()

	// Load configuration
	cfg, err := config.LoadConfig(*configPath)
	if err != nil {
		log.Fatalf("Failed to load configuration: %v", err)
	}

	// Validate configuration
	if len(cfg.Servers) == 0 {
		log.Fatal("No servers configured. Please check your configuration.")
	}

	// Override configuration with command line arguments if provided
	if cfg.RunEvery == 0 {
		cfg.RunEvery = *runEvery
	}

	// Initialize Redis client
	redisClient, err := redis.NewClient(*redisURL)
	if err != nil {
		log.Fatalf("Failed to connect to Redis: %v", err)
	}
	defer redisClient.Close()

	// Flush Redis DB on startup to clear old configurations
	if err := redisClient.FlushDB(); err != nil {
		log.Fatalf("Failed to flush Redis database: %v", err)
	}

	// Create worker
	w := worker.New(cfg, redisClient)

	// Create context that will be canceled on SIGTERM or SIGINT
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	// Handle termination signals
	sigCh := make(chan os.Signal, 1)
	signal.Notify(sigCh, syscall.SIGTERM, syscall.SIGINT)
	go func() {
		sig := <-sigCh
		log.Printf("Received signal: %v", sig)
		cancel()
	}()

	// Run the worker
	log.Printf("Starting TraefikRelay with %d servers", len(cfg.Servers))
	go func() {
		ticker := time.NewTicker(time.Duration(cfg.RunEvery) * time.Second)
		defer ticker.Stop()

		// Run once immediately
		if err := w.Execute(ctx); err != nil {
			log.Printf("Error executing worker: %v", err)
		}

		// Then run periodically
		for {
			select {
			case <-ticker.C:
				if err := w.Execute(ctx); err != nil {
					log.Printf("Error executing worker: %v", err)
				}
			case <-ctx.Done():
				log.Println("Worker stopped")
				return
			}
		}
	}()

	// Start API server if enabled
	if *enableAPI {
		apiServer := api.NewServer(cfg, redisClient)
		go func() {
			if err := apiServer.Start(*apiPort); err != nil {
				log.Fatalf("API server error: %v", err)
			}
		}()
		log.Printf("API server started on port %d", *apiPort)
	}

	// Wait for termination signal
	<-ctx.Done()
	log.Println("Shutting down...")
}

func getEnv(key, fallback string) string {
	if value, exists := os.LookupEnv(key); exists {
		return value
	}
	return fallback
}

func getIntEnv(key string, fallback int) int {
	if value, exists := os.LookupEnv(key); exists {
		var result int
		if _, err := fmt.Sscanf(value, "%d", &result); err == nil {
			return result
		}
	}
	return fallback
}

func getBoolEnv(key string, fallback bool) bool {
	if value, exists := os.LookupEnv(key); exists {
		return value == "1" || value == "true" || value == "yes" || value == "y"
	}
	return fallback
}