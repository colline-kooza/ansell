package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type PropertyInquiry struct {
	ID        uuid.UUID `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`

	PropertyID uuid.UUID `gorm:"type:uuid;not null;index" json:"property_id"`
	Property   Property  `gorm:"foreignKey:PropertyID" json:"property"`

	UserID *uuid.UUID `gorm:"type:uuid;index" json:"user_id,omitempty"` // nullable — guest inquiry

	Name    string `gorm:"not null" json:"name"`
	Email   string `gorm:"not null" json:"email"`
	Phone   string `json:"phone"`
	Message string `gorm:"type:text;not null" json:"message"`

	IsRead bool `gorm:"default:false;index" json:"is_read"`
}

func (pi *PropertyInquiry) BeforeCreate(tx *gorm.DB) error {
	if pi.ID == uuid.Nil {
		pi.ID = uuid.New()
	}
	return nil
}

// Ensure no DeletedAt — inquiries are not soft deleted
var _ = (*gorm.DB)(nil) // keep gorm import
