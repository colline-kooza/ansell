package database

import (
	"fmt"
	"log"
	"time"

	"ansell-backend-api/internal/config"
	"ansell-backend-api/internal/models"

	"golang.org/x/crypto/bcrypt"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

func Connect(cfg *config.Config) *gorm.DB {
	var db *gorm.DB
	var err error

	for i := 1; i <= 5; i++ {
		db, err = gorm.Open(postgres.Open(cfg.DatabaseURL), &gorm.Config{
			Logger:                                   logger.Default.LogMode(logger.Warn),
			PrepareStmt:                              true,
			DisableForeignKeyConstraintWhenMigrating: false,
		})
		if err == nil {
			break
		}
		log.Printf("DB connection attempt %d/5 failed: %v", i, err)
		time.Sleep(time.Duration(i) * 2 * time.Second)
	}

	if err != nil {
		log.Fatalf("Failed to connect to database after 5 attempts: %v", err)
	}

	sqlDB, err := db.DB()
	if err != nil {
		log.Fatalf("Failed to get sql.DB from gorm: %v", err)
	}
	sqlDB.SetMaxIdleConns(10)
	sqlDB.SetMaxOpenConns(100)
	sqlDB.SetConnMaxLifetime(time.Hour)

	log.Println("Database connected successfully")
	return db
}

// Migrate runs GORM AutoMigrate on every startup. Safe: only adds, never drops.
func Migrate(db *gorm.DB) {
	allModels := []interface{}{
		&models.User{},
		&models.OwnerApplication{},
		&models.Property{},
		&models.PropertyInquiry{},
		&models.CompanyApplication{},
		&models.Company{},
		&models.Job{},
		&models.JobApplication{},
		&models.SupplierApplication{},
		&models.Supplier{},
		&models.Tender{},
		&models.TenderBid{},
		&models.VideoAdvert{},
		&models.Article{},
		&models.UserFeedPreference{},
		&models.Course{},
		&models.Enrollment{},
		&models.NationalIDApplication{},
		&models.NationalIDStatusHistory{},
	}

	log.Println("Running database migrations...")
	for _, model := range allModels {
		name := fmt.Sprintf("%T", model)
		if err := db.AutoMigrate(model); err != nil {
			log.Fatalf("Migration failed for %s: %v", name, err)
		}
		log.Printf("  migrated %s", name)
	}
	log.Println("All migrations completed successfully")

	SeedSuperAdmin(db)
	SeedPlatformCompany(db)
}

// SeedSuperAdmin creates the default super admin if none exists.
func SeedSuperAdmin(db *gorm.DB) {
	var count int64
	db.Model(&models.User{}).Where("role = ?", models.RoleSuperAdmin).Count(&count)
	if count > 0 {
		return
	}

	hashed, err := bcrypt.GenerateFromPassword([]byte("Admin@1234"), bcrypt.DefaultCost)
	if err != nil {
		log.Printf("Failed to hash super admin password: %v", err)
		return
	}

	admin := models.User{
		FirstName: "Super",
		LastName:  "Admin",
		Email:     "admin@anasell.com",
		Password:  string(hashed),
		Role:      models.RoleSuperAdmin,
		IsActive:  true,
		Provider:  models.ProviderLocal,
	}

	if err := db.Create(&admin).Error; err != nil {
		log.Printf("Failed to seed super admin: %v", err)
		return
	}
	log.Println("  seeded super admin: admin@anasell.com / Admin@1234")
}

// SeedPlatformCompany ensures there is a default company for admin-posted jobs.
func SeedPlatformCompany(db *gorm.DB) {
	var admin models.User
	if err := db.Where("role = ?", models.RoleSuperAdmin).Order("created_at asc").First(&admin).Error; err != nil {
		log.Printf("Skipping platform company seed: no super admin found: %v", err)
		return
	}

	var existing models.Company
	if err := db.Where("owner_id = ?", admin.ID).Order("created_at asc").First(&existing).Error; err == nil {
		return
	} else if err != gorm.ErrRecordNotFound {
		log.Printf("Failed to check platform company: %v", err)
		return
	}

	company := models.Company{
		OwnerID:       admin.ID,
		CompanyName:   "Ansell",
		CompanyType:   "platform",
		Industry:      "Marketplace",
		Email:         admin.Email,
		City:          "Juba",
		Description:   "Default platform company for administrator-posted jobs.",
		EmployeeCount: "1-10",
		IsVerified:    true,
		IsActive:      true,
	}

	if err := db.Create(&company).Error; err != nil {
		log.Printf("Failed to seed platform company: %v", err)
		return
	}

	log.Printf("  seeded platform company: %s", company.CompanyName)
}
