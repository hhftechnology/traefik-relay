package traefik

import (
	"context"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"strings"
	"time"

	"github.com/hhftechnology/traefik-relay/internal/config"
)

// Client is a client for interacting with the Traefik API
type Client struct {
	httpClient *http.Client
	server     *config.Server
}

// NewClient creates a new Traefik API client
func NewClient(server *config.Server) *Client {
	return &Client{
		httpClient: &http.Client{
			Timeout: 10 * time.Second,
		},
		server: server,
	}
}

// GetHttpRouters fetches all HTTP routers from the Traefik API
func (c *Client) GetHttpRouters(ctx context.Context) ([]HttpRouter, error) {
	req, err := c.createRequest(ctx, "api/http/routers")
	if err != nil {
		return nil, err
	}

	var routers []HttpRouter
	if err := c.doRequest(req, &routers); err != nil {
		return nil, err
	}

	return routers, nil
}

// GetTcpRouters fetches all TCP routers from the Traefik API
func (c *Client) GetTcpRouters(ctx context.Context) ([]TcpRouter, error) {
	req, err := c.createRequest(ctx, "api/tcp/routers")
	if err != nil {
		return nil, err
	}

	var routers []TcpRouter
	if err := c.doRequest(req, &routers); err != nil {
		return nil, err
	}

	return routers, nil
}

// GetMiddlewares fetches all middlewares from the Traefik API
func (c *Client) GetMiddlewares(ctx context.Context) ([]Middleware, error) {
	req, err := c.createRequest(ctx, "api/http/middlewares")
	if err != nil {
		return nil, err
	}

	var middlewares []Middleware
	if err := c.doRequest(req, &middlewares); err != nil {
		return nil, err
	}

	return middlewares, nil
}

// GetServices fetches all services from the Traefik API
func (c *Client) GetServices(ctx context.Context) ([]Service, error) {
	req, err := c.createRequest(ctx, "api/http/services")
	if err != nil {
		return nil, err
	}

	var services []Service
	if err := c.doRequest(req, &services); err != nil {
		return nil, err
	}

	return services, nil
}

// createRequest creates a new HTTP request with the appropriate headers
func (c *Client) createRequest(ctx context.Context, path string) (*http.Request, error) {
	apiURL, err := url.Parse(c.server.ApiAddress)
	if err != nil {
		return nil, fmt.Errorf("invalid API address: %w", err)
	}

	// Join the base URL with the path
	apiURL.Path = strings.TrimRight(apiURL.Path, "/") + "/" + strings.TrimLeft(path, "/")

	// Create the request
	req, err := http.NewRequestWithContext(ctx, "GET", apiURL.String(), nil)
	if err != nil {
		return nil, fmt.Errorf("error creating request: %w", err)
	}

	// Add basic auth if provided in the URL
	if apiURL.User != nil {
		username := apiURL.User.Username()
		password, _ := apiURL.User.Password()
		auth := username + ":" + password
		req.Header.Set("Authorization", "Basic "+base64.StdEncoding.EncodeToString([]byte(auth)))
	}

	// Set the Host header if provided
	if c.server.ApiHost != "" {
		req.Host = c.server.ApiHost
	}

	// Set Accept header
	req.Header.Set("Accept", "application/json")

	return req, nil
}

// doRequest performs the HTTP request and unmarshals the response
func (c *Client) doRequest(req *http.Request, result interface{}) error {
	resp, err := c.httpClient.Do(req)
	if err != nil {
		return fmt.Errorf("error making request: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("API error (status %d): %s", resp.StatusCode, string(body))
	}

	if err := json.NewDecoder(resp.Body).Decode(result); err != nil {
		return fmt.Errorf("error decoding response: %w", err)
	}

	return nil
}