package utils

import (
	"fmt"
	"regexp"
	"strings"

	"ansell-backend-api/internal/models"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

var (
	companySlugPattern  = regexp.MustCompile(`[^a-z0-9\s-]`)
	companySpacePattern = regexp.MustCompile(`[\s_-]+`)
)

func GenerateUniqueCompanySlug(db *gorm.DB, name string, excludeID *uuid.UUID) (string, error) {
	baseSlug := NormalizeCompanySlug(name)
	if baseSlug == "" {
		baseSlug = "company"
	}

	slug := baseSlug
	suffix := 2

	for {
		query := db.Model(&models.Company{}).Where("slug = ?", slug)
		if excludeID != nil {
			query = query.Where("id <> ?", *excludeID)
		}

		var count int64
		if err := query.Count(&count).Error; err != nil {
			return "", err
		}
		if count == 0 {
			return slug, nil
		}

		slug = fmt.Sprintf("%s-%d", baseSlug, suffix)
		suffix++
	}
}

func NormalizeCompanySlug(name string) string {
	slug := strings.ToLower(strings.TrimSpace(name))
	slug = companySlugPattern.ReplaceAllString(slug, "")
	slug = companySpacePattern.ReplaceAllString(slug, "-")
	return strings.Trim(slug, "-")
}
