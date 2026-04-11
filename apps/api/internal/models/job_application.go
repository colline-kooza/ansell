package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type JobApplication struct {
	ID        uuid.UUID      `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`

	JobID uuid.UUID `gorm:"type:uuid;not null;index" json:"job_id"`
	Job   Job       `gorm:"foreignKey:JobID" json:"job"`

	ApplicantID *uuid.UUID `gorm:"type:uuid;index" json:"applicant_id,omitempty"`
	Applicant   *User      `gorm:"foreignKey:ApplicantID" json:"applicant,omitempty"`

	FullName          string `gorm:"not null" json:"full_name"`
	Email             string `gorm:"not null" json:"email"`
	Phone             string `json:"phone"`
	CoverLetter       string `gorm:"type:text" json:"cover_letter"`
	CVUrl             string `json:"cv_url"`
	LinkedInURL       string `json:"linkedin_url"`
	PortfolioURL      string `json:"portfolio_url"`
	YearsOfExperience *int   `json:"years_of_experience"`
	CurrentJobTitle   string `json:"current_job_title"`

	Status     string `gorm:"type:varchar(20);default:'submitted';index" json:"status"` // submitted, under_review, shortlisted, interviewed, offered, rejected
	ReviewNote string `json:"review_note"`
}

func (a *JobApplication) BeforeCreate(tx *gorm.DB) error {
	if a.ID == uuid.Nil {
		a.ID = uuid.New()
	}
	return nil
}
