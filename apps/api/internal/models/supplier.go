package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type Supplier struct {
	ID        uuid.UUID      `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`

	OwnerID uuid.UUID `gorm:"type:uuid;not null;index" json:"owner_id"`
	Owner   User      `gorm:"foreignKey:OwnerID" json:"owner"`

	BusinessName       string `gorm:"not null" json:"business_name"`
	BusinessType       string `json:"business_type"`
	Industry           string `json:"industry"`
	RegistrationNumber string `json:"registration_number"`
	PhoneNumber        string `json:"phone_number"`
	Email              string `json:"email"`
	Website            string `json:"website"`
	Address            string `json:"address"`
	City               string `json:"city"`
	Description        string `gorm:"type:text" json:"description"`
	LogoURL            string `json:"logo_url"`
	EmployeeCount      string `json:"employee_count"`

	IsVerified bool `gorm:"default:false" json:"is_verified"`
	IsActive   bool `gorm:"default:true" json:"is_active"`
}

func (s *Supplier) BeforeCreate(tx *gorm.DB) error {
	if s.ID == uuid.Nil {
		s.ID = uuid.New()
	}
	return nil
}
