package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type Company struct {
	ID        uuid.UUID      `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`

	OwnerID uuid.UUID `gorm:"type:uuid;not null;index" json:"owner_id"`
	Owner   User      `gorm:"foreignKey:OwnerID" json:"owner"`

	CompanyName   string `gorm:"not null" json:"company_name"`
	CompanyType   string `json:"company_type"`
	Industry      string `json:"industry"`
	PhoneNumber   string `json:"phone_number"`
	Email         string `json:"email"`
	Website       string `json:"website"`
	Address       string `json:"address"`
	City          string `json:"city"`
	Description   string `gorm:"type:text" json:"description"`
	LogoURL       string `json:"logo_url"`
	EmployeeCount string `json:"employee_count"`

	IsVerified bool `gorm:"default:false" json:"is_verified"`
	IsActive   bool `gorm:"default:true" json:"is_active"`
	Slug       string `gorm:"uniqueIndex" json:"slug"`
}

func (c *Company) BeforeCreate(tx *gorm.DB) error {
	if c.ID == uuid.Nil {
		c.ID = uuid.New()
	}
	return nil
}
