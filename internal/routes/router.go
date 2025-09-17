package routes

import (
	"github.com/gofiber/fiber/v2"
)

func CreateRoutes(app *fiber.App) {

	app.Get("/", func(c *fiber.Ctx) error {
		return c.Render("index", nil)
	})

	wsRouter := app.Group("/ws")
	SetWebsocketRoutes(wsRouter)
}
