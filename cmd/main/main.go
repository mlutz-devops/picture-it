package main

import (
	"fmt"
	"log"
	"sync"
	"time"

	"github.com/gofiber/contrib/websocket"
	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/template/html/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
)

var mp sync.Map

func main() {



	engine := html.New("./templates", ".html")

	app := fiber.New(fiber.Config{
		Views: engine,
	})
	app.Static("/static", "./static")

	app.Use(cors.New())

	app.Get("/", func(c *fiber.Ctx) error {
		return c.Render("index", nil)
	})

	app.Get("/sockets", func(c *fiber.Ctx) error {
		mp.Range(func(key, value any) bool {
			c := key.(*websocket.Conn)
			fmt.Println(c)
			return true
		})
		return c.Status(fiber.StatusOK).SendString("Hello")
	})

	app.Use("/ws", func(c *fiber.Ctx) error {
		if websocket.IsWebSocketUpgrade(c) {
			c.Locals("allowed", true)
			return c.Next()
		}
		return fiber.ErrUpgradeRequired
	})

	app.Get("/ws", websocket.New(func(c *websocket.Conn) {
		log.Println("client connected")
		mp.Store(c, true)

		defer func() {
			mp.Delete(c)
			c.Close()
			log.Println("client disconnected")
		}()

		var (
			mt  int
			msg []byte
			err error
		)
		for {
			if mt, msg, err = c.ReadMessage(); err != nil {
				break
			}
			log.Printf("recv: %s", msg)

			if err = c.WriteMessage(mt, msg); err != nil {
				log.Println("write:", err)
				break
			}
		}
	}))

	go func() {
		ticker := time.NewTicker(time.Second * 5)
		for range ticker.C {
			mp.Range(func(key, value any) bool {
				c := key.(*websocket.Conn)

				message := map[string]any{
					"hello": "there",
					"type": "color",
				}

				err := c.WriteJSON(message)
				if err != nil {
					mp.Delete(c)
					c.Close()
					fmt.Println("client closed")
				}
				return true

			})
		}
	}()

	log.Fatal(app.Listen(":8080"))

}
