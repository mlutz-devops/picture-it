package routes

import (
	"encoding/json"
	"fmt"
	"log"

	"github.com/gofiber/contrib/websocket"
	"github.com/gofiber/fiber/v2"
	"michaellutz.org/picture-it/internal/state"
)

type wsMessage struct {
	Type string    `json:"type"`
	Data any       `json:"data"`
	Grid [][][]int `json:"grid"`
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

func handleMessage(conn *websocket.Conn, msg []byte) error {
	var message wsMessage
	err := json.Unmarshal(msg, &message)
	if err != nil {
		return err
	}
	log.Println("Message type recieved: ", message.Type)
	switch message.Type {
	case "get_grid":

		state.GridMutex.Lock()
		message := wsMessage{
			Type: "color",
			Grid: state.Grid,
		}
		state.GridMutex.Unlock()

		conn.WriteJSON(message)
	case "color":
		state.GridMutex.Lock()
		state.Grid = message.Grid
		emitGrid(state.Grid)
		state.GridMutex.Unlock()
	}

	return nil
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
