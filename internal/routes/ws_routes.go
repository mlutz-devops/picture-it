package routes

import (
	"context"
	"encoding/json"
	"fmt"
	"log"

	"github.com/gofiber/contrib/websocket"
	"github.com/gofiber/fiber/v2"
	"michaellutz.org/picture-it/internal/state"
)

type wsMessage struct {
	Type    string    `json:"type"`
	Data    any       `json:"data"`
	Grid    [][][]int `json:"grid"`
	Enabled *bool     `json:"enabled,omitempty"`
}

func SetWebsocketRoutes(router fiber.Router) {

	router.Get("/sockets", func(c *fiber.Ctx) error {
		count := 0
		state.MP.Range(func(key, value any) bool {
			count += 1
			return true
		})
		return c.Status(fiber.StatusOK).SendString(fmt.Sprintf("Conn Count: %d", count))
	})

	router.Use("/", func(c *fiber.Ctx) error {
		if websocket.IsWebSocketUpgrade(c) {
			c.Locals("allowed", true)
			return c.Next()
		}
		return fiber.ErrUpgradeRequired
	})

	router.Get("/", websocket.New(func(c *websocket.Conn) {
		log.Printf("client connected")
		state.MP.Store(c, true)

		defer func() {
			state.MP.Delete(c)
			c.Close()
		}()

		var (
			msg []byte
			err error
		)
		for {
			if _, msg, err = c.ReadMessage(); err != nil {
				log.Println("read error:", err, msg)
				break
			}
			err := handleMessage(c, msg)
			if err != nil {
				log.Println("Error handling message: ", err)
			}
		}
	}))
}

func StartRedisGridSubscriber(ctx context.Context) error {
	if err := state.SubscribeToGridUpdates(ctx, func(grid [][][]int) {
		emitGrid(grid)
	}); err != nil {
		return err
	}

	return state.SubscribeToDateWeatherStateUpdates(ctx, func(enabled bool) {
		emitDateWeatherState(enabled)
	})
}

func handleMessage(conn *websocket.Conn, msg []byte) error {
	var message wsMessage
	err := json.Unmarshal(msg, &message)
	if err != nil {
		return err
	}
	log.Println("Message type recieved: ", message.Type)
	switch message.Type {
	case "get_grid":
		grid, err := state.GetGridFromRedis()
		if err != nil {
			log.Println("Error loading grid from redis:", err)
		}
		enabled, err := state.GetDateWeatherStateFromRedis()
		if err != nil {
			log.Println("Error loading date/weather state from redis:", err)
		}

		message := wsMessage{
			Type:    "color",
			Grid:    grid,
			Enabled: &enabled,
		}
		conn.WriteJSON(message)
	case "color":
		if err := state.PersistGridToRedis(message.Grid); err != nil {
			log.Println("Error persisting grid to redis:", err)
		}

		if state.RedisClient != nil {
			if err := state.PublishGridUpdate(message.Grid); err != nil {
				log.Println("Error publishing grid update to redis:", err)
				emitGrid(message.Grid)
			}
		} else {
			emitGrid(message.Grid)
		}
	case "dw_toggle":
		enabled := message.Enabled != nil && *message.Enabled

		if err := state.PersistDateWeatherStateToRedis(enabled); err != nil {
			log.Println("Error persisting date/weather state to redis:", err)
		}

		if state.RedisClient != nil {
			if err := state.PublishDateWeatherStateUpdate(enabled); err != nil {
				log.Println("Error publishing date/weather state to redis:", err)
				emitDateWeatherState(enabled)
			}
		} else {
			emitDateWeatherState(enabled)
		}
	}

	return nil
}

func emitDateWeatherState(enabled bool) {
	state.MP.Range(func(key, value any) bool {
		c := key.(*websocket.Conn)

		message := wsMessage{
			Type:    "dw_toggle",
			Data:    nil,
			Enabled: &enabled,
		}
		j, _ := json.Marshal(message)
		err := c.WriteMessage(websocket.TextMessage, j)
		if err != nil {
			state.MP.Delete(c)
			c.Close()
			log.Println("Connection closed with error: ", err)
		}

		return true
	})
}

func emitGrid(grid [][][]int) {
	state.MP.Range(func(key, value any) bool {
		c := key.(*websocket.Conn)

		message := wsMessage{
			Type: "color",
			Data: nil,
			Grid: grid,
		}
		j, _ := json.Marshal(message)
		err := c.WriteMessage(websocket.TextMessage, j)
		if err != nil {
			state.MP.Delete(c)
			c.Close()
			log.Println("Connection closed with error: ", err)
		}

		return true
	})

}
