package config

import (
	"fmt"
	"net/url"
	"os"

	"gopkg.in/yaml.v3"
)

// Config represents the main application configuration
type Config struct {
	Servers            []Server `yaml:"servers"`
	RunEvery           int      `yaml:"runEvery"`
	ForwardMiddlewares bool     `yaml:"forwardMiddlewares"`
	ForwardServices    bool     `yaml:"forwardServices"`
}

// Server represents a Traefik server configuration
type Server struct {
	Name               string            `yaml:"name"`
	ApiAddress         string            `yaml:"apiAddress"`
	ApiHost            string            `yaml:"apiHost"`
	DestinationAddress string            `yaml:"destinationAddress"`
	ForwardMiddlewares *bool             `yaml:"forwardMiddlewares"`
	ForwardServices    *bool             `yaml:"forwardServices"`
	EntryPoints        map[string]string `yaml:"entryPoints"`
}

// LoadConfig loads the configuration from a YAML file
func LoadConfig(path string) (*Config, error) {
	data, err := os.ReadFile(path)
	if err != nil {
		return nil, fmt.Errorf("error reading config file: %w", err)
	}

	var config Config
	if err := yaml.Unmarshal(data, &config); err != nil {
		return nil, fmt.Errorf("error parsing config file: %w", err)
	}

	// Set default values and validate
	if err := validateConfig(&config); err != nil {
		return nil, err
	}

	return &config, nil
}

// validateConfig validates the configuration and sets default values
func validateConfig(config *Config) error {
	if len(config.Servers) == 0 {
		return fmt.Errorf("no servers configured")
	}

	// Default runEvery if not set
	if config.RunEvery <= 0 {
		// We'll use the value from environment or command line flag
		config.RunEvery = 0
	}

	for i, server := range config.Servers {
		// Validate server name
		if server.Name == "" {
			return fmt.Errorf("server #%d is missing a name", i+1)
		}

		// Validate API address
		if server.ApiAddress == "" {
			return fmt.Errorf("server '%s' is missing apiAddress", server.Name)
		}
		if _, err := url.Parse(server.ApiAddress); err != nil {
			return fmt.Errorf("server '%s' has invalid apiAddress: %w", server.Name, err)
		}

		// Validate destination address
		if server.DestinationAddress == "" {
			return fmt.Errorf("server '%s' is missing destinationAddress", server.Name)
		}
		if _, err := url.Parse(server.DestinationAddress); err != nil {
			return fmt.Errorf("server '%s' has invalid destinationAddress: %w", server.Name, err)
		}

		// Set default entry points if not provided
		if len(server.EntryPoints) == 0 {
			server.EntryPoints = map[string]string{
				"http": "http",
			}
			config.Servers[i].EntryPoints = server.EntryPoints
		}
	}

	return nil
}

// GetServerForwardMiddlewares determines if middlewares should be forwarded for a server
func (s *Server) GetServerForwardMiddlewares(globalSetting bool) bool {
	if s.ForwardMiddlewares != nil {
		return *s.ForwardMiddlewares
	}
	return globalSetting
}

// GetServerForwardServices determines if services should be forwarded for a server
func (s *Server) GetServerForwardServices(globalSetting bool) bool {
	if s.ForwardServices != nil {
		return *s.ForwardServices
	}
	return globalSetting
}