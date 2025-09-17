package server

import (
	"log"
	"os"
	"os/signal"
	"syscall"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/template/html/v2"
	"michaellutz.org/picture-it/internal/config"
	"michaellutz.org/picture-it/internal/routes"
)

func BuildApp(env config.Config) *fiber.App {
	engine := html.New("./templates", ".html")

	app := fiber.New(fiber.Config{
		Views: engine,
	})
	app.Static("/static", "./static")

	app.Use(cors.New())

	routes.CreateRoutes(app)

	return app
}

func RunApp(config config.Config) (func(), error) {
	app := BuildApp(config)

	go func(){
		log.Fatal(app.Listen(":" + config.Port))
	}()
	return func(){
		app.Shutdown()
	}, nil
}

func ShutdownGracefully(){
	stop := make(chan os.Signal, 1)
	defer close(stop)

	signal.Reset(syscall.SIGINT, syscall.SIGTERM)
	signal.Notify(stop, syscall.SIGINT, syscall.SIGTERM)
	<-stop
}
