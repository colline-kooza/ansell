package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// NationalIDStatus represents the lifecycle status of an application.
type NationalIDStatus string

const (
	NIDStatusSubmitted        NationalIDStatus = "submitted"
	NIDStatusUnderReview      NationalIDStatus = "under_review"
	NIDStatusDocumentsRequired NationalIDStatus = "documents_required"
	NIDStatusDocumentsVerified NationalIDStatus = "documents_verified"
	NIDStatusProcessing       NationalIDStatus = "processing"
	NIDStatusReadyForPickup   NationalIDStatus = "ready_for_pickup"
	NIDStatusCollected        NationalIDStatus = "collected"
	NIDStatusRejected         NationalIDStatus = "rejected"
)

// NationalIDIDType represents the type of identity document being applied for.
type NationalIDIDType string

const (
	NIDTypeNationalID            NationalIDIDType = "national_id"
	NIDTypeBirthCertificate      NationalIDIDType = "birth_certificate_registration"
)

// NationalIDApplication is the primary application record submitted by a citizen.
type NationalIDApplication struct {
	ID        uint           `gorm:"primaryKey" json:"id"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`

	// Applicant
	ApplicantID uuid.UUID `gorm:"type:uuid;not null;index" json:"applicant_id"`
	Applicant   User      `gorm:"foreignKey:ApplicantID" json:"applicant"`

	// Reference number — generated server-side, e.g. "NID-2026-004821"
	ReferenceNumber string `gorm:"not null;uniqueIndex" json:"reference_number"`

	// ── Personal Information ──────────────────────────────────────────────────
	FirstName     string `gorm:"not null" json:"first_name"`
	MiddleName    string `json:"middle_name"`
	LastName      string `gorm:"not null" json:"last_name"`
	DateOfBirth   string `gorm:"not null" json:"date_of_birth"` // "YYYY-MM-DD"
	Gender        string `gorm:"type:varchar(10)" json:"gender"`
	Nationality   string `gorm:"default:'South Sudanese'" json:"nationality"`
	PlaceOfBirth  string `gorm:"not null" json:"place_of_birth"`
	StateOfOrigin string `gorm:"not null;index" json:"state_of_origin"`
	CountyOfOrigin string `gorm:"not null" json:"county_of_origin"`
	MaritalStatus string `gorm:"type:varchar(20)" json:"marital_status"`
	Occupation    string `json:"occupation"`

	// ── Contact & Residence ───────────────────────────────────────────────────
	PhoneNumber    string `gorm:"not null" json:"phone_number"`
	Email          string `json:"email"`
	CurrentAddress string `gorm:"not null" json:"current_address"`
	CurrentCity    string `gorm:"not null" json:"current_city"`
	CurrentState   string `gorm:"not null;index" json:"current_state"`

	// ── Next of Kin ───────────────────────────────────────────────────────────
	NextOfKinName         string `gorm:"not null" json:"next_of_kin_name"`
	NextOfKinRelationship string `gorm:"not null" json:"next_of_kin_relationship"`
	NextOfKinPhone        string `gorm:"not null" json:"next_of_kin_phone"`
	NextOfKinAddress      string `json:"next_of_kin_address"`

	// ── Uploaded Documents (R2 URLs) ─────────────────────────────────────────
	PassportPhotoURL      string `gorm:"not null" json:"passport_photo_url"`
	BirthCertificateURL   string `json:"birth_certificate_url"`
	ProofOfResidenceURL   string `json:"proof_of_residence_url"`
	AdditionalDocumentURL string `json:"additional_document_url"`

	// ── Application Metadata ─────────────────────────────────────────────────
	IDType     NationalIDIDType `gorm:"type:varchar(40);default:'national_id';index" json:"id_type"`
	Status     NationalIDStatus `gorm:"type:varchar(30);default:'submitted';index" json:"status"`
	StatusNote string           `gorm:"type:text" json:"status_note"`

	ProcessedByID *uint      `gorm:"index" json:"processed_by_id,omitempty"`
	ProcessedAt   *time.Time `json:"processed_at,omitempty"`

	CollectionOffice   string     `json:"collection_office"`
	CollectionDeadline *time.Time `json:"collection_deadline,omitempty"`
	AssignedIDNumber   string     `gorm:"index" json:"assigned_id_number"`

	SubmittedAt time.Time `gorm:"not null" json:"submitted_at"`

	// Populated via Preload
	StatusHistory []NationalIDStatusHistory `gorm:"foreignKey:ApplicationID" json:"status_history,omitempty"`
}

// NationalIDStatusHistory records every status transition for audit trail.
type NationalIDStatusHistory struct {
	ID            uint      `gorm:"primaryKey" json:"id"`
	CreatedAt     time.Time `json:"created_at"`

	ApplicationID uint                  `gorm:"not null;index" json:"application_id"`
	Application   NationalIDApplication `gorm:"foreignKey:ApplicationID" json:"-"`

	UpdatedByID uint `gorm:"not null;index" json:"updated_by_id"`
	UpdatedBy   User `gorm:"foreignKey:UpdatedByID" json:"updated_by"`

	FromStatus NationalIDStatus `gorm:"type:varchar(30)" json:"from_status"`
	ToStatus   NationalIDStatus `gorm:"type:varchar(30);index" json:"to_status"`
	Note       string           `gorm:"type:text" json:"note"`
}
