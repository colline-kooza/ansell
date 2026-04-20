package main

import (
	"log"

	"ansell-backend-api/internal/config"
	"ansell-backend-api/internal/database"
	"ansell-backend-api/internal/routes"

	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
)

func main() {
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found, using system environment variables")
	}

	// Load config
	cfg := config.Load()

	// Set Gin mode
	if cfg.AppEnv == "production" {
		gin.SetMode(gin.ReleaseMode)
	}

	// Connect to database
	db := database.Connect(cfg)

	// Run migrations
	database.Migrate(db)

	// Set up router
	router := routes.Setup(db, cfg)

	log.Printf("Server starting on port %s", cfg.Port)
	if err := router.Run(":" + cfg.Port); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}
