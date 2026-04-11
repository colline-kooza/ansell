package models

import (
	"strings"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type UserRole string
type AuthProvider string

const (
	RoleSuperAdmin    UserRole = "super_admin"
	RolePropertyOwner UserRole = "property_owner"
	RoleCompanyOwner  UserRole = "company_owner"
	RoleSupplier      UserRole = "supplier"
	RoleUser          UserRole = "user"

	ProviderLocal  AuthProvider = "local"
	ProviderGoogle AuthProvider = "google"
)

type User struct {
	ID        uuid.UUID      `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`

	FirstName string   `gorm:"not null;default:''" json:"first_name"`
	LastName  string   `gorm:"not null;default:''" json:"last_name"`
	Name      string   `gorm:"column:name;not null;default:''" json:"-"`
	Email     string   `gorm:"uniqueIndex;not null" json:"email"`
	Password  string   `gorm:"not null;default:''" json:"-"`
	Phone     string   `json:"phone"`
	Avatar    string   `json:"avatar"`
	Role      UserRole `gorm:"type:varchar(20);default:'user'" json:"role"`
	IsActive  bool     `gorm:"default:true" json:"is_active"`

	IsEmailVerified bool `gorm:"default:false" json:"is_email_verified"`
	
	// Extended Profile Fields
	Bio         string    `gorm:"type:text" json:"bio"`
	Gender      string    `json:"gender"`
	DateOfBirth *time.Time `json:"date_of_birth"`
	NationalID  string    `json:"national_id"`
	Country     string    `json:"country"`
	CityState   string    `json:"city_state"`
	PostalCode  string    `json:"postal_code"`
	TaxID       string    `json:"tax_id"`

	// OAuth
	Provider AuthProvider `gorm:"type:varchar(20);default:'local'" json:"provider"`
	GoogleID string       `gorm:"index" json:"-"`
}

func (u *User) BeforeCreate(tx *gorm.DB) error {
	if u.ID == uuid.Nil {
		u.ID = uuid.New()
	}
	u.syncLegacyName()
	return nil
}

func (u *User) BeforeSave(tx *gorm.DB) error {
	u.syncLegacyName()
	return nil
}

// FullName returns the user's full display name.
func (u *User) FullName() string {
	if u.FirstName == "" && u.LastName == "" {
		return u.Email
	}
	return strings.TrimSpace(u.FirstName + " " + u.LastName)
}

func (u *User) syncLegacyName() {
	u.Name = u.FullName()
}
