package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type SupplierApplication struct {
	ID        uuid.UUID      `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`

	UserID uuid.UUID `gorm:"type:uuid;not null;index" json:"user_id"`
	User   User      `gorm:"foreignKey:UserID" json:"user"`

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
	DocumentURL        string `json:"document_url"`
	EmployeeCount      string `json:"employee_count"`

	Status     ApplicationStatus `gorm:"type:varchar(20);default:'pending';index" json:"status"`
	ReviewNote string            `json:"review_note"`

	ReviewedBy *uuid.UUID `gorm:"type:uuid" json:"reviewed_by,omitempty"`
	ReviewedAt *time.Time `json:"reviewed_at,omitempty"`
}

func (a *SupplierApplication) BeforeCreate(tx *gorm.DB) error {
	if a.ID == uuid.Nil {
		a.ID = uuid.New()
	}
	return nil
}
