package redisclient

import (
	"context"
	"fmt"
	"net"
	"time"

	"github.com/redis/go-redis/v9"
	"michaellutz.org/picture-it/internal/config"
)

func NewClient(cfg config.Config) (*redis.Client, error) {
	addr := net.JoinHostPort(cfg.RedisHost, cfg.RedisPort)
	client := redis.NewClient(&redis.Options{
		Addr:     addr,
		Password: cfg.RedisPassword,
		DB:       0,
	})

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if err := client.Ping(ctx).Err(); err != nil {
		client.Close()
		return nil, fmt.Errorf("connect to redis at %s: %w", addr, err)
	}

	return client, nil
}
