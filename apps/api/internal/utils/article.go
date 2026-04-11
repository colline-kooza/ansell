package utils

import (
	"fmt"
	"html"
	"regexp"
	"strings"

	"ansell-backend-api/internal/models"

	"gorm.io/gorm"
)

var (
	articleHTMLTagPattern = regexp.MustCompile(`<[^>]+>`)
	articleSlugPattern    = regexp.MustCompile(`[^a-z0-9\s-]`)
	articleSpacePattern   = regexp.MustCompile(`[\s_-]+`)
)

func CalculateArticleReadTimeMinutes(content string) int {
	plainText := articleHTMLTagPattern.ReplaceAllString(content, " ")
	plainText = html.UnescapeString(plainText)
	wordCount := len(strings.Fields(plainText))
	if wordCount == 0 {
		return 1
	}

	readTime := wordCount / 200
	if wordCount%200 != 0 {
		readTime++
	}
	if readTime < 1 {
		return 1
	}

	return readTime
}

func GenerateUniqueArticleSlug(db *gorm.DB, title string, excludeID *uint) (string, error) {
	baseSlug := NormalizeArticleSlug(title)
	if baseSlug == "" {
		baseSlug = "article"
	}

	slug := baseSlug
	suffix := 2

	for {
		query := db.Model(&models.Article{}).Where("slug = ?", slug)
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

func NormalizeArticleSlug(title string) string {
	slug := strings.ToLower(strings.TrimSpace(title))
	slug = articleSlugPattern.ReplaceAllString(slug, "")
	slug = articleSpacePattern.ReplaceAllString(slug, "-")
	return strings.Trim(slug, "-")
}
