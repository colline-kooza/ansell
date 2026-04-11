package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type CourseCategory string
type CourseStatus string
type CourseMode string

const (
	CourseCategoryUniversityCollege         CourseCategory = "university_college"
	CourseCategoryScholarships              CourseCategory = "scholarships"
	CourseCategoryTelecomICT                CourseCategory = "telecom_ict"
	CourseCategoryBankingFinance            CourseCategory = "banking_finance"
	CourseCategoryAgricultureAgribusiness   CourseCategory = "agriculture_agribusiness"
	CourseCategoryConstructionInfrastructure CourseCategory = "construction_infrastructure"
	CourseCategoryHealthcareMedical         CourseCategory = "healthcare_medical"
	CourseCategoryVocationalSkills          CourseCategory = "vocational_skills"
)

const (
	CourseStatusDraft    CourseStatus = "draft"
	CourseStatusActive   CourseStatus = "active"
	CourseStatusArchived CourseStatus = "archived"
)

const (
	CourseModeOnline    CourseMode = "online"
	CourseModeInPerson  CourseMode = "in_person"
	CourseModeHybrid    CourseMode = "hybrid"
)

type Course struct {
	ID        uint           `gorm:"primaryKey" json:"id"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`

	CreatedByID uuid.UUID `gorm:"type:uuid;not null;index" json:"created_by_id"`
	CreatedBy   User      `gorm:"foreignKey:CreatedByID" json:"created_by"`

	Title       string         `gorm:"not null" json:"title"`
	Description string         `gorm:"type:text" json:"description"`
	Notes       string         `gorm:"type:text" json:"notes"`
	Provider    string         `gorm:"not null" json:"provider"`
	Category    CourseCategory `gorm:"type:varchar(60);index" json:"category"`

	Price    float64 `gorm:"default:0" json:"price"`
	Currency string  `gorm:"type:varchar(10);default:'USD'" json:"currency"`
	IsFree   bool    `gorm:"default:false;index" json:"is_free"`

	VideoURL     string `gorm:"type:text" json:"video_url"`
	ThumbnailURL string `gorm:"type:text" json:"thumbnail_url"`

	Duration  string     `json:"duration"`
	Mode      CourseMode `gorm:"type:varchar(20);default:'in_person'" json:"mode"`
	Location  string     `json:"location"`
	City      string     `json:"city"`
	StartDate *time.Time `json:"start_date"`
	EndDate   *time.Time `json:"end_date"`
	Schedule  string     `gorm:"type:text" json:"schedule"`

	Capacity *int `json:"capacity"`
	Enrolled int  `gorm:"default:0" json:"enrolled"`

	Status     CourseStatus `gorm:"type:varchar(20);default:'draft'" json:"status"`
	IsActive   bool         `gorm:"default:true;index" json:"is_active"`
	IsFeatured bool         `gorm:"default:false;index" json:"is_featured"`

	// JSON-encoded arrays stored as text
	Curriculum   string `gorm:"type:text" json:"curriculum"`
	Requirements string `gorm:"type:text" json:"requirements"`
	Tags         string `gorm:"type:text" json:"tags"`

	ContactEmail string `json:"contact_email"`
	ContactPhone string `json:"contact_phone"`

	Views int `gorm:"default:0" json:"views"`
}
