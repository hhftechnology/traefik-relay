package redis

import (
	"context"
	"fmt"
	"time"

	"github.com/go-redis/redis/v8"
)

// Client is a wrapper around redis.Client
type Client struct {
	rdb *redis.Client
}

// NewClient creates a new Redis client
func NewClient(addr string) (*Client, error) {
	opts, err := redis.ParseURL(fmt.Sprintf("redis://%s", addr))
	if err != nil {
		return nil, fmt.Errorf("invalid Redis URL: %w", err)
	}

	rdb := redis.NewClient(opts)

	// Test the connection
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if err := rdb.Ping(ctx).Err(); err != nil {
		return nil, fmt.Errorf("failed to connect to Redis: %w", err)
	}

	return &Client{rdb: rdb}, nil
}

// Close closes the Redis client
func (c *Client) Close() error {
	return c.rdb.Close()
}

// FlushDB flushes the Redis database
func (c *Client) FlushDB() error {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	return c.rdb.FlushDB(ctx).Err()
}

// StoreEntries stores multiple key-value pairs in Redis
func (c *Client) StoreEntries(ctx context.Context, entries map[string]string) error {
	if len(entries) == 0 {
		return nil
	}

	// Use a pipeline to efficiently execute multiple commands
	pipe := c.rdb.Pipeline()
	for key, value := range entries {
		pipe.Set(ctx, key, value, 0)
	}

	_, err := pipe.Exec(ctx)
	return err
}

// DeleteKeys deletes multiple keys from Redis
func (c *Client) DeleteKeys(ctx context.Context, keys []string) error {
	if len(keys) == 0 {
		return nil
	}

	return c.rdb.Del(ctx, keys...).Err()
}

// StringUpdateIfChanged updates a Redis key only if the value has changed
func (c *Client) StringUpdateIfChanged(ctx context.Context, key, value string) error {
	// First, get the current value
	currentValue, err := c.rdb.Get(ctx, key).Result()
	if err != nil && err != redis.Nil {
		return err
	}

	// If the key doesn't exist or the value is different, update it
	if err == redis.Nil || currentValue != value {
		return c.rdb.Set(ctx, key, value, 0).Err()
	}

	return nil
}

// GetAllKeys gets all keys in the Redis database
func (c *Client) GetAllKeys(ctx context.Context) ([]string, error) {
	return c.rdb.Keys(ctx, "*").Result()
}