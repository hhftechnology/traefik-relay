package api

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"sync"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"
	"github.com/hhftechnology/traefik-relay/internal/config"
	"github.com/hhftechnology/traefik-relay/internal/redis"
	"github.com/hhftechnology/traefik-relay/internal/traefik"
)

// Server represents the API server
type Server struct {
	router      *chi.Mux
	config      *config.Config
	redisClient *redis.Client
	statusInfo  *StatusInfo
	mu          sync.RWMutex
}

// StatusInfo holds the status information for all servers
type StatusInfo struct {
	LastUpdated time.Time                `json:"lastUpdated"`
	Servers     map[string]*ServerStatus `json:"servers"`
}

// ServerStatus holds the status information for a single server
type ServerStatus struct {
	Online        bool      `json:"online"`
	LastChecked   time.Time `json:"lastChecked"`
	HttpRouters   int       `json:"httpRouters"`
	TcpRouters    int       `json:"tcpRouters"`
	Middlewares   int       `json:"middlewares"`
	Services      int       `json:"services"`
	Error         string    `json:"error,omitempty"`
	Configuration any       `json:"configuration"`
}

// DetailedServerStatus holds detailed status information for a server
type DetailedServerStatus struct {
	ServerStatus
	HttpRouters   []traefik.HttpRouter `json:"httpRouterDetails"`
	TcpRouters    []traefik.TcpRouter  `json:"tcpRouterDetails"`
	Middlewares   []traefik.Middleware `json:"middlewareDetails"`
	Services      []traefik.Service    `json:"serviceDetails"`
}

// NewServer creates a new API server
func NewServer(cfg *config.Config, redisClient *redis.Client) *Server {
	r := chi.NewRouter()

	// Middleware
	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)
	r.Use(middleware.Timeout(30 * time.Second))
	
	// CORS configuration
	r.Use(cors.Handler(cors.Options{
		AllowedOrigins:   []string{"*"}, // Change this in production
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type"},
		ExposedHeaders:   []string{"Link"},
		AllowCredentials: true,
		MaxAge:           300, // Maximum value not readily apparent
	}))

	// Create status info
	statusInfo := &StatusInfo{
		LastUpdated: time.Now(),
		Servers:     make(map[string]*ServerStatus),
	}

	// Initialize server status for each configured server
	for _, server := range cfg.Servers {
		statusInfo.Servers[server.Name] = &ServerStatus{
			Online:      false,
			LastChecked: time.Now(),
			Configuration: server,
		}
	}

	server := &Server{
		router:      r,
		config:      cfg,
		redisClient: redisClient,
		statusInfo:  statusInfo,
	}

	// Register routes
	server.registerRoutes()

	return server
}

// Start starts the API server
func (s *Server) Start(port int) error {
	// Start background status updater
	go s.statusUpdater()
	
	addr := fmt.Sprintf(":%d", port)
	log.Printf("Starting API server on %s", addr)
	return http.ListenAndServe(addr, s.router)
}

// registerRoutes registers the API routes
func (s *Server) registerRoutes() {
	r := s.router

	// API versioning
	r.Route("/api/v1", func(r chi.Router) {
		// Status endpoint
		r.Get("/status", s.handleGetStatus)
		
		// Servers endpoints
		r.Route("/servers", func(r chi.Router) {
			r.Get("/", s.handleGetServers)
			r.Get("/{serverName}", s.handleGetServerDetail)
			r.Post("/{serverName}/refresh", s.handleRefreshServer)
		})
		
		// Config endpoints
		r.Route("/config", func(r chi.Router) {
			r.Get("/", s.handleGetConfig)
			r.Put("/", s.handleUpdateConfig)
		})
		
		// Redis endpoints
		r.Route("/redis", func(r chi.Router) {
			r.Get("/keys", s.handleGetRedisKeys)
			r.Post("/flush", s.handleFlushRedis)
		})
	})

	// Serve static files for UI
	fs := http.FileServer(http.Dir("./ui/dist"))
	r.Handle("/*", http.StripPrefix("/", fs))
}

// statusUpdater periodically updates the status of all servers
func (s *Server) statusUpdater() {
	// Update immediately
	s.updateAllServerStatus()

	// Then update every minute
	ticker := time.NewTicker(1 * time.Minute)
	defer ticker.Stop()

	for range ticker.C {
		s.updateAllServerStatus()
	}
}

// updateAllServerStatus updates the status of all servers
func (s *Server) updateAllServerStatus() {
	s.mu.Lock()
	defer s.mu.Unlock()

	// Create context with timeout
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	// Update status for each server
	for _, server := range s.config.Servers {
		status := s.statusInfo.Servers[server.Name]
		status.LastChecked = time.Now()

		// Initialize Traefik client
		client := traefik.NewClient(&server)

		// Check HTTP routers
		httpRouters, err := client.GetHttpRouters(ctx)
		if err != nil {
			status.Online = false
			status.Error = fmt.Sprintf("Failed to get HTTP routers: %v", err)
			continue
		}

		// Check TCP routers
		tcpRouters, err := client.GetTcpRouters(ctx)
		if err != nil {
			status.Online = false
			status.Error = fmt.Sprintf("Failed to get TCP routers: %v", err)
			continue
		}

		// Check middlewares
		middlewares, err := client.GetMiddlewares(ctx)
		if err != nil {
			status.Online = false
			status.Error = fmt.Sprintf("Failed to get middlewares: %v", err)
			continue
		}

		// Check services
		services, err := client.GetServices(ctx)
		if err != nil {
			status.Online = false
			status.Error = fmt.Sprintf("Failed to get services: %v", err)
			continue
		}

		// Update status
		status.Online = true
		status.Error = ""
		status.HttpRouters = len(httpRouters)
		status.TcpRouters = len(tcpRouters)
		status.Middlewares = len(middlewares)
		status.Services = len(services)
	}

	s.statusInfo.LastUpdated = time.Now()
}

// handleGetStatus handles the GET /api/v1/status endpoint
func (s *Server) handleGetStatus(w http.ResponseWriter, r *http.Request) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	writeJSON(w, s.statusInfo, http.StatusOK)
}

// handleGetServers handles the GET /api/v1/servers endpoint
func (s *Server) handleGetServers(w http.ResponseWriter, r *http.Request) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	writeJSON(w, s.statusInfo.Servers, http.StatusOK)
}

// handleGetServerDetail handles the GET /api/v1/servers/{serverName} endpoint
func (s *Server) handleGetServerDetail(w http.ResponseWriter, r *http.Request) {
	s.mu.RLock()
	serverName := chi.URLParam(r, "serverName")
	
	serverStatus, ok := s.statusInfo.Servers[serverName]
	if !ok {
		s.mu.RUnlock()
		http.Error(w, "Server not found", http.StatusNotFound)
		return
	}
	s.mu.RUnlock()

	// Find server config
	var serverConfig *config.Server
	for _, server := range s.config.Servers {
		if server.Name == serverName {
			serverConfig = &server
			break
		}
	}

	if serverConfig == nil {
		http.Error(w, "Server configuration not found", http.StatusNotFound)
		return
	}

	// Create a new, fresh client for fetching latest data
	client := traefik.NewClient(serverConfig)
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	// Create detailed status
	detailedStatus := DetailedServerStatus{
		ServerStatus: *serverStatus,
	}

	// Fetch detailed information
	var wg sync.WaitGroup
	var errHttp, errTcp, errMiddleware, errService error

	wg.Add(4)
	
	// Fetch HTTP routers
	go func() {
		defer wg.Done()
		httpRouters, err := client.GetHttpRouters(ctx)
		if err != nil {
			errHttp = err
			return
		}
		detailedStatus.HttpRouters = httpRouters
	}()

	// Fetch TCP routers
	go func() {
		defer wg.Done()
		tcpRouters, err := client.GetTcpRouters(ctx)
		if err != nil {
			errTcp = err
			return
		}
		detailedStatus.TcpRouters = tcpRouters
	}()

	// Fetch middlewares
	go func() {
		defer wg.Done()
		middlewares, err := client.GetMiddlewares(ctx)
		if err != nil {
			errMiddleware = err
			return
		}
		detailedStatus.Middlewares = middlewares
	}()

	// Fetch services
	go func() {
		defer wg.Done()
		services, err := client.GetServices(ctx)
		if err != nil {
			errService = err
			return
		}
		detailedStatus.Services = services
	}()

	wg.Wait()

	// Check for errors
	if errHttp != nil || errTcp != nil || errMiddleware != nil || errService != nil {
		detailedStatus.Error = "Failed to fetch some data"
		if errHttp != nil {
			detailedStatus.Error += fmt.Sprintf("; HTTP routers: %v", errHttp)
		}
		if errTcp != nil {
			detailedStatus.Error += fmt.Sprintf("; TCP routers: %v", errTcp)
		}
		if errMiddleware != nil {
			detailedStatus.Error += fmt.Sprintf("; Middlewares: %v", errMiddleware)
		}
		if errService != nil {
			detailedStatus.Error += fmt.Sprintf("; Services: %v", errService)
		}
	}

	writeJSON(w, detailedStatus, http.StatusOK)
}

// handleRefreshServer handles the POST /api/v1/servers/{serverName}/refresh endpoint
func (s *Server) handleRefreshServer(w http.ResponseWriter, r *http.Request) {
	serverName := chi.URLParam(r, "serverName")
	
	s.mu.RLock()
	_, ok := s.statusInfo.Servers[serverName]
	s.mu.RUnlock()
	
	if !ok {
		http.Error(w, "Server not found", http.StatusNotFound)
		return
	}

	// Find server config
	var serverConfig *config.Server
	for _, server := range s.config.Servers {
		if server.Name == serverName {
			serverConfig = &server
			break
		}
	}

	if serverConfig == nil {
		http.Error(w, "Server configuration not found", http.StatusNotFound)
		return
	}

	// Update server status
	s.mu.Lock()
	status := s.statusInfo.Servers[serverName]
	status.LastChecked = time.Now()

	// Initialize Traefik client
	client := traefik.NewClient(serverConfig)
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	// Check HTTP routers
	httpRouters, err := client.GetHttpRouters(ctx)
	if err != nil {
		status.Online = false
		status.Error = fmt.Sprintf("Failed to get HTTP routers: %v", err)
		s.mu.Unlock()
		writeJSON(w, map[string]string{"status": "error", "message": status.Error}, http.StatusOK)
		return
	}

	// Check TCP routers
	tcpRouters, err := client.GetTcpRouters(ctx)
	if err != nil {
		status.Online = false
		status.Error = fmt.Sprintf("Failed to get TCP routers: %v", err)
		s.mu.Unlock()
		writeJSON(w, map[string]string{"status": "error", "message": status.Error}, http.StatusOK)
		return
	}

	// Check middlewares
	middlewares, err := client.GetMiddlewares(ctx)
	if err != nil {
		status.Online = false
		status.Error = fmt.Sprintf("Failed to get middlewares: %v", err)
		s.mu.Unlock()
		writeJSON(w, map[string]string{"status": "error", "message": status.Error}, http.StatusOK)
		return
	}

	// Check services
	services, err := client.GetServices(ctx)
	if err != nil {
		status.Online = false
		status.Error = fmt.Sprintf("Failed to get services: %v", err)
		s.mu.Unlock()
		writeJSON(w, map[string]string{"status": "error", "message": status.Error}, http.StatusOK)
		return
	}

	// Update status
	status.Online = true
	status.Error = ""
	status.HttpRouters = len(httpRouters)
	status.TcpRouters = len(tcpRouters)
	status.Middlewares = len(middlewares)
	status.Services = len(services)
	s.mu.Unlock()

	writeJSON(w, map[string]string{"status": "success"}, http.StatusOK)
}

// handleGetConfig handles the GET /api/v1/config endpoint
func (s *Server) handleGetConfig(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, s.config, http.StatusOK)
}

// handleUpdateConfig handles the PUT /api/v1/config endpoint
func (s *Server) handleUpdateConfig(w http.ResponseWriter, r *http.Request) {
	// This is a placeholder for future implementation
	// In a real implementation, this would:
	// 1. Parse the new configuration from the request body
	// 2. Validate it
	// 3. Write it to disk
	// 4. Reload the application
	
	http.Error(w, "Not implemented", http.StatusNotImplemented)
}

// handleGetRedisKeys handles the GET /api/v1/redis/keys endpoint
func (s *Server) handleGetRedisKeys(w http.ResponseWriter, r *http.Request) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	// Get all keys from Redis
	keys, err := s.redisClient.GetAllKeys(ctx)
	if err != nil {
		http.Error(w, fmt.Sprintf("Failed to get Redis keys: %v", err), http.StatusInternalServerError)
		return
	}

	writeJSON(w, keys, http.StatusOK)
}

// handleFlushRedis handles the POST /api/v1/redis/flush endpoint
func (s *Server) handleFlushRedis(w http.ResponseWriter, r *http.Request) {
	// Flush Redis database
	if err := s.redisClient.FlushDB(); err != nil {
		http.Error(w, fmt.Sprintf("Failed to flush Redis: %v", err), http.StatusInternalServerError)
		return
	}

	writeJSON(w, map[string]string{"status": "success"}, http.StatusOK)
}

// writeJSON writes a JSON response
func writeJSON(w http.ResponseWriter, data interface{}, status int) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	
	if err := json.NewEncoder(w).Encode(data); err != nil {
		log.Printf("Error encoding JSON: %v", err)
	}
}