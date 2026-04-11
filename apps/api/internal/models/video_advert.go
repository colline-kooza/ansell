package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type VideoAdvertCategory string

const (
	CategoryRealEstatePromos  VideoAdvertCategory = "real_estate_promos"
	CategoryCorporateCampaigns VideoAdvertCategory = "corporate_campaigns"
	CategoryProductLaunches   VideoAdvertCategory = "product_launches"
	CategoryServiceSpotlights VideoAdvertCategory = "service_spotlights"
	CategorySponsoredContent  VideoAdvertCategory = "sponsored_content"
)

type VideoAdvert struct {
	ID        uint           `gorm:"primaryKey" json:"id"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`

	CreatedByID uuid.UUID `gorm:"type:uuid;not null;index" json:"created_by_id"`
	CreatedBy   User      `gorm:"foreignKey:CreatedByID" json:"created_by"`

	Title        string              `gorm:"not null" json:"title"`
	Description  string              `gorm:"type:text" json:"description"`
	Sponsor      string              `json:"sponsor"`
	Category     VideoAdvertCategory `gorm:"type:varchar(50);index" json:"category"`
	VideoURL     string              `gorm:"not null" json:"video_url"`
	ThumbnailURL string              `gorm:"not null" json:"thumbnail_url"`
	Duration     *int                `json:"duration"`
	IsActive     bool                `gorm:"default:true;index" json:"is_active"`
	IsFeatured   bool                `gorm:"default:false;index" json:"is_featured"`
	Views        int                 `gorm:"default:0" json:"views"`
}
