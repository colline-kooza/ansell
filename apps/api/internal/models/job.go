package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type Job struct {
	ID        uuid.UUID      `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`

	CompanyID *uuid.UUID `gorm:"type:uuid;index" json:"company_id"`
	Company   *Company   `gorm:"foreignKey:CompanyID" json:"company"`

	PostedByID uuid.UUID `gorm:"type:uuid;not null;index" json:"posted_by_id"`
	PostedBy   User      `gorm:"foreignKey:PostedByID" json:"posted_by"`

	Title              string     `gorm:"not null" json:"title"`
	Description        string     `gorm:"type:text" json:"description"`
	Category           string     `gorm:"index" json:"category"` // ngo_un, government, private_sector, international, startup
	JobType            string     `json:"job_type"`              // full_time, part_time, contract, internship, volunteer, remote
	ExperienceLevel    string     `json:"experience_level"`      // entry, mid, senior, executive, any
	CareerLevel        string     `json:"career_level"`          // junior, mid_level, senior, manager, director, c_level
	SalaryMin          *float64   `json:"salary_min"`
	SalaryMax          *float64   `json:"salary_max"`
	SalaryCurrency     string     `gorm:"default:'USD'" json:"salary_currency"`
	SalaryPeriod       string     `gorm:"default:'per_month'" json:"salary_period"` // per_month, per_year, per_day
	IsSalaryVisible    bool       `gorm:"default:true" json:"is_salary_visible"`
	City               string     `gorm:"index" json:"city"`
	Location           string     `json:"location"`
	Skills             string     `gorm:"type:text" json:"skills"`         // JSON array
	Qualifications     string     `gorm:"type:text" json:"qualifications"` // JSON array
	ApplicationDeadline *time.Time `json:"application_deadline"`
	ApplicationEmail   string     `json:"application_email"`
	ApplicationURL     string     `json:"application_url"`
	ApplicationType    string     `gorm:"default:'internal'" json:"application_type"` // internal, external_email, external_url
	IsFeatured         bool       `gorm:"default:false" json:"is_featured"`
	IsActive           bool       `gorm:"default:true" json:"is_active"`
	Status             string     `gorm:"type:varchar(20);default:'pending_review';index" json:"status"` // draft, pending_review, active, closed, rejected
	Views              int        `gorm:"default:0" json:"views"`
	ApplicationCount   int        `gorm:"default:0" json:"application_count"`
}

func (j *Job) BeforeCreate(tx *gorm.DB) error {
	if j.ID == uuid.Nil {
		j.ID = uuid.New()
	}
	return nil
}
