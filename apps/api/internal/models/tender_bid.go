package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type TenderBid struct {
	ID        uuid.UUID      `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`

	TenderID uuid.UUID `gorm:"type:uuid;not null;index" json:"tender_id"`
	Tender   Tender    `gorm:"foreignKey:TenderID" json:"tender"`

	SupplierID uuid.UUID `gorm:"type:uuid;not null;index" json:"supplier_id"`
	Supplier   Supplier  `gorm:"foreignKey:SupplierID" json:"supplier"`

	BidAmount             *float64  `json:"bid_amount"`
	BidCurrency           string    `gorm:"default:'USD'" json:"bid_currency"`
	TechnicalProposalURL  string    `json:"technical_proposal_url"`
	FinancialProposalURL  string    `json:"financial_proposal_url"`
	AdditionalDocumentURL string    `json:"additional_document_url"`
	CoverLetter           string    `gorm:"type:text" json:"cover_letter"`
	CompanyProfile        string    `gorm:"type:text" json:"company_profile"`
	YearsInBusiness       *int      `json:"years_in_business"`
	PreviousContracts     string    `gorm:"type:text" json:"previous_contracts"`
	Status                string    `gorm:"type:varchar(20);default:'submitted';index" json:"status"`
	ReviewNote            string    `json:"review_note"`
	SubmittedAt           time.Time `json:"submitted_at"`
}

func (b *TenderBid) BeforeCreate(tx *gorm.DB) error {
	if b.ID == uuid.Nil {
		b.ID = uuid.New()
	}
	if b.SubmittedAt.IsZero() {
		b.SubmittedAt = time.Now()
	}
	return nil
}
