package main

import (
	"fmt"
	"log"

	"ansell-backend-api/internal/config"
	"ansell-backend-api/internal/database"
	"ansell-backend-api/internal/models"

	"github.com/joho/godotenv"
	"golang.org/x/crypto/bcrypt"
)

func main() {
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found, using system environment variables")
	}

	cfg := config.Load()
	db := database.Connect(cfg)
	database.Migrate(db)

	email := "admin@ansell.com"
	password := "Admin@1234"

	// Check if already exists
	var existing models.User
	if err := db.Where("email = ?", email).First(&existing).Error; err == nil {
		// Already exists — just update role and reset password
		hashed, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
		if err != nil {
			log.Fatalf("Failed to hash password: %v", err)
		}
		db.Model(&existing).Updates(map[string]interface{}{
			"role":      models.RoleSuperAdmin,
			"password":  string(hashed),
			"is_active": true,
		})
		fmt.Println("✅ Super admin already existed — role and password updated.")
		fmt.Printf("   Email:    %s\n", email)
		fmt.Printf("   Password: %s\n", password)
		return
	}

	// Hash password
	hashed, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		log.Fatalf("Failed to hash password: %v", err)
	}

	admin := models.User{
		FirstName: "Super",
		LastName:  "Admin",
		Email:     email,
		Password:  string(hashed),
		Role:      models.RoleSuperAdmin,
		Provider:  models.ProviderLocal,
		IsActive:  true,
	}

	if err := db.Create(&admin).Error; err != nil {
		log.Fatalf("Failed to create super admin: %v", err)
	}

	fmt.Println("✅ Super admin created successfully!")
	fmt.Printf("   Email:    %s\n", email)
	fmt.Printf("   Password: %s\n", password)
}
