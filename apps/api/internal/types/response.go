package types

import (
	"ansell-backend-api/internal/models"
	"time"
)

// SuccessResponse is the standard success API response
type SuccessResponse struct {
	Success bool        `json:"success"`
	Message string      `json:"message"`
	Data    interface{} `json:"data,omitempty"`
}

// ErrorResponse is the standard error API response
type ErrorResponse struct {
	Success bool   `json:"success"`
	Message string `json:"message"`
	Error   string `json:"error,omitempty"`
}

// PaginatedResponse wraps paginated data
type PaginatedResponse struct {
	Success    bool        `json:"success"`
	Message    string      `json:"message"`
	Data       interface{} `json:"data"`
	Page       int         `json:"page"`
	PageSize   int         `json:"page_size"`
	TotalItems int64       `json:"total_items"`
	TotalPages int         `json:"total_pages"`
}

// AuthResponse is returned on login/register
type AuthResponse struct {
	Token string      `json:"token"`
	User  interface{} `json:"user"`
}

// RegisterRequest is the payload for user registration
type RegisterRequest struct {
	FirstName string `json:"first_name" binding:"required,min=1,max=100"`
	LastName  string `json:"last_name" binding:"required,min=1,max=100"`
	Email     string `json:"email" binding:"required,email"`
	Password  string `json:"password" binding:"required,min=8"`
	Phone     string `json:"phone"`
}

// LoginRequest is the payload for user login
type LoginRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required"`
}

// UpdateUserRequest is the payload for updating a user
type UpdateUserRequest struct {
	FirstName   string     `json:"first_name" binding:"omitempty,min=1,max=100"`
	LastName    string     `json:"last_name" binding:"omitempty,min=1,max=100"`
	Phone       string     `json:"phone"`
	Avatar      string     `json:"avatar"`
	Bio         string     `json:"bio"`
	Gender      string     `json:"gender"`
	DateOfBirth *time.Time `json:"date_of_birth"`
	NationalID  string     `json:"national_id"`
	Country     string     `json:"country"`
	CityState   string     `json:"city_state"`
	PostalCode  string     `json:"postal_code"`
	TaxID       string     `json:"tax_id"`
}

// ChangePasswordRequest is the payload for changing password
type ChangePasswordRequest struct {
	CurrentPassword string `json:"current_password" binding:"required"`
	NewPassword     string `json:"new_password" binding:"required,min=8"`
}

// OwnerApplicationRequest is the payload for creating an owner application
type OwnerApplicationRequest struct {
	BusinessName string `json:"business_name" binding:"required"`
	BusinessType string `json:"business_type" binding:"required"`
	PhoneNumber  string `json:"phone_number" binding:"required"`
	Address      string `json:"address"`
	City         string `json:"city" binding:"required"`
	Description  string `json:"description" binding:"required"`
	DocumentURL  string `json:"document_url"`
}

// ReviewApplicationRequest is the payload for approving/rejecting applications
type ReviewApplicationRequest struct {
	ReviewNote string `json:"review_note"`
}

// CreatePropertyRequest is the payload for creating a property
type CreatePropertyRequest struct {
	Title        string                  `json:"title" binding:"required"`
	Description  string                  `json:"description"`
	Category     models.PropertyCategory `json:"category" binding:"required"`
	Price        float64                 `json:"price"`
	PricePeriod  string                  `json:"price_period"`
	Currency     string                  `json:"currency"`
	City         string                  `json:"city" binding:"required"`
	Location     string                  `json:"location"`
	Address      string                  `json:"address"`
	Bedrooms     *int                    `json:"bedrooms"`
	Bathrooms    *int                    `json:"bathrooms"`
	SizeM2       *float64                `json:"size_m2"`
	Amenities    string                  `json:"amenities"`
	Images       string                  `json:"images"`
	IsFeatured   bool                    `json:"is_featured"`
	IsActive     bool                    `json:"is_active"`
	Status       models.PropertyStatus   `json:"status"`
	ContactPhone string                  `json:"contact_phone"`
	ContactEmail string                  `json:"contact_email"`
}

// UpdatePropertyRequest is the payload for updating a property
type UpdatePropertyRequest struct {
	Title        string                  `json:"title"`
	Description  string                  `json:"description"`
	Category     models.PropertyCategory `json:"category"`
	Price        float64                 `json:"price"`
	PricePeriod  string                  `json:"price_period"`
	Currency     string                  `json:"currency"`
	City         string                  `json:"city"`
	Location     string                  `json:"location"`
	Address      string                  `json:"address"`
	Bedrooms     *int                    `json:"bedrooms"`
	Bathrooms    *int                    `json:"bathrooms"`
	SizeM2       *float64                `json:"size_m2"`
	Amenities    string                  `json:"amenities"`
	Images       string                  `json:"images"`
	IsFeatured   *bool                   `json:"is_featured"`
	IsActive     *bool                   `json:"is_active"`
	Status       models.PropertyStatus   `json:"status"`
	ContactPhone string                  `json:"contact_phone"`
	ContactEmail string                  `json:"contact_email"`
	ReviewNote   string                  `json:"review_note"`
}

// SubmitInquiryRequest is the payload for submitting a property inquiry
type SubmitInquiryRequest struct {
	Name    string `json:"name" binding:"required"`
	Email   string `json:"email" binding:"required,email"`
	Phone   string `json:"phone"`
	Message string `json:"message" binding:"required"`
}

// CompanyApplicationRequest is the payload for creating a company application
type CompanyApplicationRequest struct {
	CompanyName   string `json:"company_name" binding:"required"`
	CompanyType   string `json:"company_type" binding:"required"`
	Industry      string `json:"industry" binding:"required"`
	PhoneNumber   string `json:"phone_number" binding:"required"`
	Email         string `json:"email" binding:"required,email"`
	Website       string `json:"website"`
	Address       string `json:"address" binding:"required"`
	City          string `json:"city" binding:"required"`
	Description   string `json:"description" binding:"required"`
	LogoURL       string `json:"logo_url"`
	DocumentURL   string `json:"document_url"`
	EmployeeCount string `json:"employee_count" binding:"required"`
}

// CreateJobRequest is the payload for creating a job
type CreateJobRequest struct {
	CompanyID           string     `json:"company_id"` // used by admin, optional for owner
	Title               string     `json:"title" binding:"required"`
	Description         string     `json:"description" binding:"required"`
	Category            string     `json:"category" binding:"required"`
	JobType             string     `json:"job_type" binding:"required"`
	ExperienceLevel     string     `json:"experience_level"`
	CareerLevel         string     `json:"career_level"`
	SalaryMin           *float64   `json:"salary_min"`
	SalaryMax           *float64   `json:"salary_max"`
	SalaryCurrency      string     `json:"salary_currency"`
	SalaryPeriod        string     `json:"salary_period"`
	IsSalaryVisible     bool       `json:"is_salary_visible"`
	City                string     `json:"city" binding:"required"`
	Location            string     `json:"location"`
	Skills              string     `json:"skills"`         // JSON array string
	Qualifications      string     `json:"qualifications"` // JSON array string
	Requirements        string     `json:"requirements"`   // alias for qualifications (frontend compat)
	ApplicationDeadline *time.Time `json:"application_deadline"`
	Deadline            string     `json:"deadline"` // date string alias (frontend compat, e.g. "2024-01-15")
	ApplicationEmail    string     `json:"application_email"`
	ApplicationURL      string     `json:"application_url"`
	ApplicationType     string     `json:"application_type"`
	PdfUrl              string     `json:"pdf_url"`
	IsFeatured          bool       `json:"is_featured"`
}

// UpdateJobRequest is the payload for updating a job
type UpdateJobRequest struct {
	Title               string     `json:"title"`
	Description         string     `json:"description"`
	Category            string     `json:"category"`
	JobType             string     `json:"job_type"`
	ExperienceLevel     string     `json:"experience_level"`
	CareerLevel         string     `json:"career_level"`
	SalaryMin           *float64   `json:"salary_min"`
	SalaryMax           *float64   `json:"salary_max"`
	SalaryCurrency      string     `json:"salary_currency"`
	SalaryPeriod        string     `json:"salary_period"`
	IsSalaryVisible     *bool      `json:"is_salary_visible"`
	City                string     `json:"city"`
	Location            string     `json:"location"`
	Skills              string     `json:"skills"`
	Qualifications      string     `json:"qualifications"`
	Requirements        string     `json:"requirements"` // alias for qualifications (frontend compat)
	ApplicationDeadline *time.Time `json:"application_deadline"`
	Deadline            string     `json:"deadline"` // date string alias (frontend compat)
	ApplicationEmail    string     `json:"application_email"`
	ApplicationURL      string     `json:"application_url"`
	ApplicationType     string     `json:"application_type"`
	PdfUrl              *string    `json:"pdf_url"`
	IsFeatured          *bool      `json:"is_featured"`
	Status              string     `json:"status"`
}

// SubmitJobApplicationRequest is the payload for submitting a job application
type SubmitJobApplicationRequest struct {
	FullName          string `json:"full_name" binding:"required"`
	Email             string `json:"email" binding:"required,email"`
	Phone             string `json:"phone"`
	CoverLetter       string `json:"cover_letter"`
	CVUrl             string `json:"cv_url" binding:"required"`
	LinkedInURL       string `json:"linkedin_url"`
	PortfolioURL      string `json:"portfolio_url"`
	YearsOfExperience *int   `json:"years_of_experience"`
	CurrentJobTitle   string `json:"current_job_title"`
}

// UpdateApplicationStatusRequest is the payload for updating application status
type UpdateApplicationStatusRequest struct {
	Status     string `json:"status" binding:"required"`
	ReviewNote string `json:"review_note"`
}

// SupplierApplicationRequest is the payload for creating a supplier application
type SupplierApplicationRequest struct {
	BusinessName       string `json:"business_name" binding:"required"`
	BusinessType       string `json:"business_type" binding:"required"`
	Industry           string `json:"industry" binding:"required"`
	RegistrationNumber string `json:"registration_number"`
	PhoneNumber        string `json:"phone_number" binding:"required"`
	Email              string `json:"email" binding:"required,email"`
	Website            string `json:"website"`
	Address            string `json:"address" binding:"required"`
	City               string `json:"city" binding:"required"`
	Description        string `json:"description" binding:"required"`
	LogoURL            string `json:"logo_url"`
	DocumentURL        string `json:"document_url"`
	EmployeeCount      string `json:"employee_count" binding:"required"`
}

// CreateTenderRequest is the payload for creating a tender
type CreateTenderRequest struct {
	CompanyID               string     `json:"company_id"`
	IssuingOrganisation     string     `json:"issuing_organisation" binding:"required"`
	IssuingOrganisationLogo string     `json:"issuing_organisation_logo"`
	Title                   string     `json:"title" binding:"required"`
	ReferenceNumber         string     `json:"reference_number"`
	Description             string     `json:"description" binding:"required"`
	Category                string     `json:"category" binding:"required"`
	TenderType              string     `json:"tender_type" binding:"required"`
	ValueEstimate           *float64   `json:"value_estimate"`
	ValueCurrency           string     `json:"value_currency"`
	City                    string     `json:"city" binding:"required"`
	Location                string     `json:"location"`
	EligibilityCriteria     string     `json:"eligibility_criteria"`
	RequiredDocuments       string     `json:"required_documents"`
	SubmissionDeadline      *time.Time `json:"submission_deadline" binding:"required"`
	TenderOpenDate          *time.Time `json:"tender_open_date"`
	BidOpeningDate          *time.Time `json:"bid_opening_date"`
	ContactPerson           string     `json:"contact_person"`
	ContactEmail            string     `json:"contact_email"`
	ContactPhone            string     `json:"contact_phone"`
	AttachmentURL           string     `json:"attachment_url"`
	IsFeatured              bool       `json:"is_featured"`
	Status                  string     `json:"status"`
}

// UpdateTenderRequest is the payload for updating a tender
type UpdateTenderRequest struct {
	CompanyID               string     `json:"company_id"`
	IssuingOrganisation     string     `json:"issuing_organisation"`
	IssuingOrganisationLogo string     `json:"issuing_organisation_logo"`
	Title                   string     `json:"title"`
	ReferenceNumber         string     `json:"reference_number"`
	Description             string     `json:"description"`
	Category                string     `json:"category"`
	TenderType              string     `json:"tender_type"`
	ValueEstimate           *float64   `json:"value_estimate"`
	ValueCurrency           string     `json:"value_currency"`
	City                    string     `json:"city"`
	Location                string     `json:"location"`
	EligibilityCriteria     string     `json:"eligibility_criteria"`
	RequiredDocuments       string     `json:"required_documents"`
	SubmissionDeadline      *time.Time `json:"submission_deadline"`
	TenderOpenDate          *time.Time `json:"tender_open_date"`
	BidOpeningDate          *time.Time `json:"bid_opening_date"`
	ContactPerson           string     `json:"contact_person"`
	ContactEmail            string     `json:"contact_email"`
	ContactPhone            string     `json:"contact_phone"`
	AttachmentURL           string     `json:"attachment_url"`
	IsFeatured              *bool      `json:"is_featured"`
	Status                  string     `json:"status"`
}

// CreateArticleRequest is the payload for creating an article
type CreateArticleRequest struct {
	Title         string   `json:"title" binding:"required"`
	Excerpt       string   `json:"excerpt" binding:"required,max=300"`
	Content       string   `json:"content" binding:"required"`
	CoverImageURL string   `json:"cover_image_url" binding:"required"`
	Category      string   `json:"category" binding:"required"`
	Tags          []string `json:"tags"`
	IsFeatured    bool     `json:"is_featured"`
	IsPublished   bool     `json:"is_published"`
}

// UpdateArticleRequest is the payload for updating an article
type UpdateArticleRequest struct {
	Title         *string   `json:"title"`
	Excerpt       *string   `json:"excerpt"`
	Content       *string   `json:"content"`
	CoverImageURL *string   `json:"cover_image_url"`
	Category      *string   `json:"category"`
	Tags          *[]string `json:"tags"`
	IsFeatured    *bool     `json:"is_featured"`
	IsPublished   *bool     `json:"is_published"`
}

// UpdateFeedPreferenceRequest is the payload for feed preference updates
type UpdateFeedPreferenceRequest struct {
	Categories []string `json:"categories"`
}

// SubmitBidRequest is the payload for submitting a tender bid
type SubmitBidRequest struct {
	BidAmount             *float64 `json:"bid_amount"`
	BidCurrency           string   `json:"bid_currency"`
	TechnicalProposalURL  string   `json:"technical_proposal_url"`
	FinancialProposalURL  string   `json:"financial_proposal_url"`
	AdditionalDocumentURL string   `json:"additional_document_url"`
	CoverLetter           string   `json:"cover_letter"`
	CompanyProfile        string   `json:"company_profile"`
	YearsInBusiness       *int     `json:"years_in_business"`
	PreviousContracts     string   `json:"previous_contracts"`
}
