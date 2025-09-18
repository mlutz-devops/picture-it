package main

import (
	"fmt"
	"os"
	"time"

	"github.com/gofiber/contrib/websocket"
	"michaellutz.org/picture-it/internal/config"
	"michaellutz.org/picture-it/internal/server"
	"michaellutz.org/picture-it/internal/state"
)

func main() {
	path := os.Getenv("CONFIG_PATH")
	config, err := config.LoadConfig(path)
	if err != nil {
		panic(err)
	}

	shutdown, err := server.RunApp(config)
	defer shutdown()

	go func() {
		ticker := time.NewTicker(time.Second * 5)
		for range ticker.C {
			state.MP.Range(func(key, value any) bool {
				c := key.(*websocket.Conn)

				message := map[string]any{
					"hello": "there",
					"type":  "greeting",
				}

				err := c.WriteJSON(message)
				if err != nil {
					state.MP.Delete(c)
					c.Close()
					fmt.Println("client closed")
				}
				return true

			})
		}
	}()

	server.ShutdownGracefully()

}
