package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type PropertyStatus string
type PropertyCategory string

const (
	PropertyDraft         PropertyStatus = "draft"
	PropertyPendingReview PropertyStatus = "pending_review"
	PropertyActive        PropertyStatus = "active"
	PropertyRejected      PropertyStatus = "rejected"
	PropertyArchived      PropertyStatus = "archived"

	CategoryRental          PropertyCategory = "rental"
	CategoryLandForSale     PropertyCategory = "land_for_sale"
	CategoryLease           PropertyCategory = "lease"
	CategoryApartment       PropertyCategory = "apartment"
	CategoryCommercialSpace PropertyCategory = "commercial_space"
)

type Property struct {
	ID        uuid.UUID      `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`

	OwnerID uuid.UUID `gorm:"type:uuid;not null;index" json:"owner_id"`
	Owner   User      `gorm:"foreignKey:OwnerID" json:"owner"`

	Title       string           `gorm:"not null" json:"title"`
	Description string           `gorm:"type:text" json:"description"`
	Category    PropertyCategory `gorm:"type:varchar(30);index" json:"category"`
	Price       float64          `json:"price"`
	PricePeriod string           `json:"price_period"` // per_month, per_year, total
	Currency    string           `gorm:"default:'USD'" json:"currency"`

	City     string `gorm:"index" json:"city"`
	Location string `json:"location"`
	Address  string `json:"address"`

	Bedrooms  *int     `json:"bedrooms,omitempty"`
	Bathrooms *int     `json:"bathrooms,omitempty"`
	SizeM2    *float64 `json:"size_m2,omitempty"`

	// JSON arrays stored as text
	Amenities string `gorm:"type:text" json:"amenities"` // JSON array
	Images    string `gorm:"type:text" json:"images"`    // JSON array of R2 URLs

	IsFeatured bool           `gorm:"default:false;index" json:"is_featured"`
	IsActive   bool           `gorm:"default:true" json:"is_active"`
	Status     PropertyStatus `gorm:"type:varchar(20);default:'pending_review';index" json:"status"`
	Views      int            `gorm:"default:0" json:"views"`

	ContactPhone string `json:"contact_phone"`
	ContactEmail string `json:"contact_email"`

	ReviewNote string `json:"review_note"`
}

func (p *Property) BeforeCreate(tx *gorm.DB) error {
	if p.ID == uuid.Nil {
		p.ID = uuid.New()
	}
	return nil
}
