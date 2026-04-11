package config

import (
	"os"
)

type Config struct {
	AppEnv      string
	Port        string
	DatabaseURL string
	JWTSecret   string

	// Google OAuth
	GoogleClientID     string
	GoogleClientSecret string
	GoogleCallbackURL  string

	// Frontend
	FrontendURL string

	// Cloudflare R2
	R2AccessKeyID     string
	R2SecretAccessKey string
	R2Endpoint        string
	R2BucketName      string
	R2PublicURL       string // public CDN URL for delivered files
}

func Load() *Config {
	return &Config{
		AppEnv:      getEnv("APP_ENV", "development"),
		Port:        getEnv("PORT", "8080"),
		DatabaseURL: getEnv("DATABASE_URL", "host=localhost user=postgres password=postgres dbname=ansell_db port=5432 sslmode=disable TimeZone=UTC"),
		JWTSecret:   getEnv("JWT_SECRET", "your-super-secret-jwt-key-change-in-production"),

		GoogleClientID:     getEnv("GOOGLE_CLIENT_ID", ""),
		GoogleClientSecret: getEnv("GOOGLE_CLIENT_SECRET", ""),
		GoogleCallbackURL:  getEnv("GOOGLE_CALLBACK_URL", "http://localhost:8080/api/auth/google/callback"),

		FrontendURL: getEnv("FRONTEND_URL", "http://localhost:3000"),

		R2AccessKeyID:     getEnv("CLOUDFLARE_R2_ACCESS_KEY_ID", ""),
		R2SecretAccessKey: getEnv("CLOUDFLARE_R2_SECRET_ACCESS_KEY", ""),
		R2Endpoint:        getEnv("CLOUDFLARE_R2_ENDPOINT", ""),
		R2BucketName:      getEnv("CLOUDFLARE_R2_BUCKET_NAME", ""),
		R2PublicURL:       getEnv("CLOUDFLARE_R2_PUBLIC_URL", ""),
	}
}

func getEnv(key, defaultVal string) string {
	if val := os.Getenv(key); val != "" {
		return val
	}
	return defaultVal
}
