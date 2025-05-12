package traefik

// HttpRouter represents a Traefik HTTP router configuration
type HttpRouter struct {
	EntryPoints []string `json:"entryPoints"`
	Middlewares []string `json:"middlewares"`
	Service     string   `json:"service"`
	Rule        string   `json:"rule"`
	Name        string   `json:"name"`
	Priority    int64    `json:"priority"`
	Status      string   `json:"status"`
	Provider    string   `json:"provider"`
}

// TcpRouter represents a Traefik TCP router configuration
type TcpRouter struct {
	EntryPoints []string `json:"entryPoints"`
	Service     string   `json:"service"`
	Rule        string   `json:"rule"`
	Name        string   `json:"name"`
	Priority    int64    `json:"priority"`
	Status      string   `json:"status"`
	Provider    string   `json:"provider"`
}

// Middleware represents a Traefik middleware configuration
type Middleware struct {
	Status  string   `json:"status"`
	UsedBy  []string `json:"usedBy"`
	Name    string   `json:"name"`
	Provider string   `json:"provider"`
}

// Service represents a Traefik service configuration
type Service struct {
	Name     string `json:"name"`
	Provider string `json:"provider"`
	Status   string `json:"status"`
}

// IsEmpty checks if a slice is empty
func IsEmpty[T any](slice []T) bool {
	return len(slice) == 0
}