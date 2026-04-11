package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type ArticleCategory string

const (
	ArticleCategoryBusiness        ArticleCategory = "business"
	ArticleCategoryGovernment      ArticleCategory = "government"
	ArticleCategoryNGOHumanitarian ArticleCategory = "ngo_humanitarian"
	ArticleCategoryInfrastructure  ArticleCategory = "infrastructure"
	ArticleCategoryOilGas          ArticleCategory = "oil_gas"
	ArticleCategoryTechnology      ArticleCategory = "technology"
	ArticleCategoryAgriculture     ArticleCategory = "agriculture"
	ArticleCategoryHealth          ArticleCategory = "health"
	ArticleCategoryEducation       ArticleCategory = "education"
	ArticleCategoryEconomy         ArticleCategory = "economy"
	ArticleCategoryGeneral         ArticleCategory = "general"
)

type Article struct {
	ID        uint           `gorm:"primaryKey" json:"id"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`

	AuthorID uuid.UUID `gorm:"type:uuid;not null;index" json:"author_id"`
	Author   User      `gorm:"foreignKey:AuthorID" json:"author"`

	Title           string          `gorm:"not null" json:"title"`
	Slug            string          `gorm:"not null;uniqueIndex" json:"slug"`
	Excerpt         string          `gorm:"size:300" json:"excerpt"`
	Content         string          `gorm:"type:text" json:"content"`
	CoverImageURL   string          `json:"cover_image_url"`
	Category        ArticleCategory `gorm:"type:varchar(40);index" json:"category"`
	Tags            string          `gorm:"type:text" json:"tags"`
	IsFeatured      bool            `gorm:"default:false;index" json:"is_featured"`
	IsPublished     bool            `gorm:"default:false;index" json:"is_published"`
	PublishedAt     *time.Time      `gorm:"index" json:"published_at"`
	ReadTimeMinutes int             `gorm:"default:1" json:"read_time_minutes"`
	Views           int             `gorm:"default:0" json:"views"`
}
