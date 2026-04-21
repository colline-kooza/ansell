package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type Tender struct {
	ID        uuid.UUID      `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`

	PostedByID uuid.UUID `gorm:"type:uuid;not null;index" json:"posted_by_id"`
	PostedBy   User      `gorm:"foreignKey:PostedByID" json:"posted_by"`

	CompanyID *uuid.UUID `gorm:"type:uuid;index" json:"company_id"`
	Company   *Company   `gorm:"foreignKey:CompanyID" json:"company"`

	IssuingOrganisation     string     `gorm:"not null" json:"issuing_organisation"`
	IssuingOrganisationLogo string     `json:"issuing_organisation_logo"`
	Title                   string     `gorm:"not null" json:"title"`
	ReferenceNumber         string     `json:"reference_number"`
	Description             string     `gorm:"type:text" json:"description"`
	Category                string     `gorm:"index" json:"category"`
	TenderType              string     `gorm:"default:'open'" json:"tender_type"`
	ValueEstimate           *float64   `json:"value_estimate"`
	ValueCurrency           string     `gorm:"default:'USD'" json:"value_currency"`
	City                    string     `gorm:"index" json:"city"`
	Location                string     `json:"location"`
	EligibilityCriteria     string     `gorm:"type:text" json:"eligibility_criteria"`
	RequiredDocuments       string     `gorm:"type:text" json:"required_documents"` // JSON array
	SubmissionDeadline      *time.Time `gorm:"index;not null" json:"submission_deadline"`
	TenderOpenDate          *time.Time `json:"tender_open_date"`
	BidOpeningDate          *time.Time `json:"bid_opening_date"`
	ContactPerson           string     `json:"contact_person"`
	ContactEmail            string     `json:"contact_email"`
	ContactPhone            string     `json:"contact_phone"`
	WebLink                 string     `json:"weblink"`
	AttachmentURL           string     `json:"attachment_url"`
	IsFeatured              bool       `gorm:"default:false" json:"is_featured"`
	IsActive                bool       `gorm:"default:true" json:"is_active"`
	Status                  string     `gorm:"type:varchar(20);default:'pending_review';index" json:"status"`
	Views                   int        `gorm:"default:0" json:"views"`
	BidCount                int        `gorm:"default:0" json:"bid_count"`
}

func (t *Tender) BeforeCreate(tx *gorm.DB) error {
	if t.ID == uuid.Nil {
		t.ID = uuid.New()
	}
	return nil
}
