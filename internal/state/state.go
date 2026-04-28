package state

import (
	"context"
	"encoding/json"
	"errors"
	"log"
	"sync"
	"time"

	"github.com/redis/go-redis/v9"
)

var MP sync.Map

var RedisClient *redis.Client

const gridRedisKey = "picture-it:grid"
const gridRedisChannel = "picture-it:grid:updates"
const dateWeatherRedisKey = "picture-it:date-weather-enabled"
const dateWeatherRedisChannel = "picture-it:date-weather-enabled:updates"

func GetGridFromRedis() ([][][]int, error) {
	if RedisClient == nil {
		return nil, nil
	}

	ctx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
	defer cancel()

	val, err := RedisClient.Get(ctx, gridRedisKey).Result()
	if errors.Is(err, redis.Nil) {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}

	var grid [][][]int
	if err := json.Unmarshal([]byte(val), &grid); err != nil {
		return nil, err
	}

	return grid, nil
}

func PersistGridToRedis(grid [][][]int) error {
	if RedisClient == nil {
		return nil
	}

	b, err := json.Marshal(grid)
	if err != nil {
		return err
	}

	ctx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
	defer cancel()

	return RedisClient.Set(ctx, gridRedisKey, b, 0).Err()
}

func PublishGridUpdate(grid [][][]int) error {
	if RedisClient == nil {
		return nil
	}

	b, err := json.Marshal(grid)
	if err != nil {
		return err
	}

	ctx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
	defer cancel()

	return RedisClient.Publish(ctx, gridRedisChannel, b).Err()
}

func SubscribeToGridUpdates(ctx context.Context, onGrid func([][][]int)) error {
	if RedisClient == nil {
		return nil
	}

	pubsub := RedisClient.Subscribe(ctx, gridRedisChannel)
	if _, err := pubsub.Receive(ctx); err != nil {
		_ = pubsub.Close()
		return err
	}

	go func() {
		defer pubsub.Close()

		ch := pubsub.Channel()
		for {
			select {
			case <-ctx.Done():
				return
			case message, ok := <-ch:
				if !ok {
					return
				}

				var grid [][][]int
				if err := json.Unmarshal([]byte(message.Payload), &grid); err != nil {
					log.Printf("failed to decode pub/sub grid payload: %v", err)
					continue
				}

				onGrid(grid)
			}
		}
	}()

	return nil
}

func GetDateWeatherStateFromRedis() (bool, error) {
	if RedisClient == nil {
		return false, nil
	}

	ctx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
	defer cancel()

	val, err := RedisClient.Get(ctx, dateWeatherRedisKey).Result()
	if errors.Is(err, redis.Nil) {
		return false, nil
	}
	if err != nil {
		return false, err
	}

	var enabled bool
	if err := json.Unmarshal([]byte(val), &enabled); err != nil {
		return false, err
	}

	return enabled, nil
}

func PersistDateWeatherStateToRedis(enabled bool) error {
	if RedisClient == nil {
		return nil
	}

	b, err := json.Marshal(enabled)
	if err != nil {
		return err
	}

	ctx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
	defer cancel()

	return RedisClient.Set(ctx, dateWeatherRedisKey, b, 0).Err()
}

func PublishDateWeatherStateUpdate(enabled bool) error {
	if RedisClient == nil {
		return nil
	}

	b, err := json.Marshal(enabled)
	if err != nil {
		return err
	}

	ctx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
	defer cancel()

	return RedisClient.Publish(ctx, dateWeatherRedisChannel, b).Err()
}

func SubscribeToDateWeatherStateUpdates(ctx context.Context, onStateChange func(bool)) error {
	if RedisClient == nil {
		return nil
	}

	pubsub := RedisClient.Subscribe(ctx, dateWeatherRedisChannel)
	if _, err := pubsub.Receive(ctx); err != nil {
		_ = pubsub.Close()
		return err
	}

	go func() {
		defer pubsub.Close()

		ch := pubsub.Channel()
		for {
			select {
			case <-ctx.Done():
				return
			case message, ok := <-ch:
				if !ok {
					return
				}

				var enabled bool
				if err := json.Unmarshal([]byte(message.Payload), &enabled); err != nil {
					log.Printf("failed to decode pub/sub date-weather payload: %v", err)
					continue
				}

				onStateChange(enabled)
			}
		}
	}()

	return nil
}
