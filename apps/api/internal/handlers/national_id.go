package handlers

import (
	"net/http"
	"strconv"
	"time"

	"ansell-backend-api/internal/models"
	nidutils "ansell-backend-api/internal/utils"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

// NationalIDHandler handles all national ID application routes.
type NationalIDHandler struct {
	db *gorm.DB
}

func NewNationalIDHandler(db *gorm.DB) *NationalIDHandler {
	return &NationalIDHandler{db: db}
}

// ─── Request types ────────────────────────────────────────────────────────────

type SubmitNationalIDRequest struct {
	// Personal
	FirstName      string `json:"first_name" binding:"required"`
	MiddleName     string `json:"middle_name"`
	LastName       string `json:"last_name" binding:"required"`
	DateOfBirth    string `json:"date_of_birth" binding:"required"`
	Gender         string `json:"gender" binding:"required"`
	Nationality    string `json:"nationality"`
	PlaceOfBirth   string `json:"place_of_birth" binding:"required"`
	StateOfOrigin  string `json:"state_of_origin" binding:"required"`
	CountyOfOrigin string `json:"county_of_origin" binding:"required"`
	MaritalStatus  string `json:"marital_status" binding:"required"`
	Occupation     string `json:"occupation"`
	// Contact
	PhoneNumber    string `json:"phone_number" binding:"required"`
	Email          string `json:"email"`
	CurrentAddress string `json:"current_address" binding:"required"`
	CurrentCity    string `json:"current_city" binding:"required"`
	CurrentState   string `json:"current_state" binding:"required"`
	// Next of kin
	NextOfKinName         string `json:"next_of_kin_name" binding:"required"`
	NextOfKinRelationship string `json:"next_of_kin_relationship" binding:"required"`
	NextOfKinPhone        string `json:"next_of_kin_phone" binding:"required"`
	NextOfKinAddress      string `json:"next_of_kin_address"`
	// Documents
	PassportPhotoURL    string `json:"passport_photo_url" binding:"required"`
	BirthCertificateURL string `json:"birth_certificate_url"`
	ProofOfResidenceURL string `json:"proof_of_residence_url"`
	// Metadata
	IDType string `json:"id_type"`
}

type UpdateNIDStatusRequest struct {
	Status             string  `json:"status" binding:"required"`
	StatusNote         string  `json:"status_note"`
	CollectionOffice   string  `json:"collection_office"`
	CollectionDeadline *string `json:"collection_deadline"` // ISO8601
	AssignedIDNumber   string  `json:"assigned_id_number"`
}

type AssignIDNumberRequest struct {
	AssignedIDNumber string `json:"assigned_id_number" binding:"required"`
}

type UploadAdditionalDocRequest struct {
	AdditionalDocumentURL string `json:"additional_document_url" binding:"required"`
}

// ─── Helper: current user UUID from context ───────────────────────────────────

func getNIDCurrentUserID(c *gin.Context) (uuid.UUID, error) {
	raw, _ := c.Get("user_id")
	return uuid.Parse(raw.(string))
}

func getNIDCurrentUserUintID(c *gin.Context, db *gorm.DB) (uint, error) {
	uid, err := getNIDCurrentUserID(c)
	if err != nil {
		return 0, err
	}
	var user models.User
	if err := db.Select("id").Where("id = ?", uid).First(&user).Error; err != nil {
		return 0, err
	}
	// User.ID is UUID — store as FK string representation not possible with uint.
	// ProcessedByID stores the row's uint surrogate if needed; we use user.ID (UUID).
	// For simplicity we store 0 here (UUID used instead).
	_ = user
	return 0, nil
}

// ─── User routes ─────────────────────────────────────────────────────────────

// SubmitApplication — POST /api/national-id/apply
func (h *NationalIDHandler) SubmitApplication(c *gin.Context) {
	applicantUUID, err := getNIDCurrentUserID(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"success": false, "message": "Unauthorized"})
		return
	}

	// Enforce one-active-application rule
	var activeCount int64
	h.db.Model(&models.NationalIDApplication{}).
		Where("applicant_id = ? AND status NOT IN ?", applicantUUID,
			[]models.NationalIDStatus{models.NIDStatusRejected, models.NIDStatusCollected}).
		Count(&activeCount)
	if activeCount > 0 {
		c.JSON(http.StatusConflict, gin.H{
			"success": false,
			"message": "You already have an active National ID application. Track it in your dashboard.",
		})
		return
	}

	var req SubmitNationalIDRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": err.Error()})
		return
	}

	refNum, err := nidutils.GenerateNationalIDReferenceNumber(h.db)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "message": "Failed to generate reference number"})
		return
	}

	idType := models.NIDTypeNationalID
	if req.IDType == string(models.NIDTypeBirthCertificate) {
		idType = models.NIDTypeBirthCertificate
	}

	now := time.Now()
	app := models.NationalIDApplication{
		ApplicantID:           applicantUUID,
		ReferenceNumber:       refNum,
		FirstName:             req.FirstName,
		MiddleName:            req.MiddleName,
		LastName:              req.LastName,
		DateOfBirth:           req.DateOfBirth,
		Gender:                req.Gender,
		Nationality:           req.Nationality,
		PlaceOfBirth:          req.PlaceOfBirth,
		StateOfOrigin:         req.StateOfOrigin,
		CountyOfOrigin:        req.CountyOfOrigin,
		MaritalStatus:         req.MaritalStatus,
		Occupation:            req.Occupation,
		PhoneNumber:           req.PhoneNumber,
		Email:                 req.Email,
		CurrentAddress:        req.CurrentAddress,
		CurrentCity:           req.CurrentCity,
		CurrentState:          req.CurrentState,
		NextOfKinName:         req.NextOfKinName,
		NextOfKinRelationship: req.NextOfKinRelationship,
		NextOfKinPhone:        req.NextOfKinPhone,
		NextOfKinAddress:      req.NextOfKinAddress,
		PassportPhotoURL:      req.PassportPhotoURL,
		BirthCertificateURL:   req.BirthCertificateURL,
		ProofOfResidenceURL:   req.ProofOfResidenceURL,
		IDType:                idType,
		Status:                models.NIDStatusSubmitted,
		SubmittedAt:           now,
	}

	if app.Nationality == "" {
		app.Nationality = "South Sudanese"
	}

	if err := h.db.Create(&app).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "message": "Failed to submit application"})
		return
	}

	// Load applicant for response
	h.db.Preload("Applicant").First(&app, app.ID)

	c.JSON(http.StatusCreated, gin.H{
		"success": true,
		"message": "Application submitted successfully. Your reference number is " + refNum,
		"data":    app,
	})
}

// GetMyApplication — GET /api/national-id/my-application
func (h *NationalIDHandler) GetMyApplication(c *gin.Context) {
	applicantUUID, err := getNIDCurrentUserID(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"success": false, "message": "Unauthorized"})
		return
	}

	var app models.NationalIDApplication
	result := h.db.
		Preload("Applicant").
		Preload("StatusHistory", func(db *gorm.DB) *gorm.DB {
			return db.Order("created_at ASC").Preload("UpdatedBy")
		}).
		Where("applicant_id = ?", applicantUUID).
		Order("created_at DESC").
		First(&app)

	if result.Error == gorm.ErrRecordNotFound {
		c.JSON(http.StatusOK, gin.H{"success": true, "data": nil})
		return
	}
	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "message": "Failed to fetch application"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"success": true, "data": app})
}

// GetMyApplications — GET /api/national-id/my-applications
func (h *NationalIDHandler) GetMyApplications(c *gin.Context) {
	applicantUUID, err := getNIDCurrentUserID(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"success": false, "message": "Unauthorized"})
		return
	}

	var apps []models.NationalIDApplication
	h.db.
		Preload("Applicant").
		Where("applicant_id = ?", applicantUUID).
		Order("created_at DESC").
		Find(&apps)

	c.JSON(http.StatusOK, gin.H{"success": true, "data": apps})
}

// UploadAdditionalDocument — PATCH /api/national-id/my-application/additional-document
func (h *NationalIDHandler) UploadAdditionalDocument(c *gin.Context) {
	applicantUUID, err := getNIDCurrentUserID(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"success": false, "message": "Unauthorized"})
		return
	}

	var req UploadAdditionalDocRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": err.Error()})
		return
	}

	var app models.NationalIDApplication
	if err := h.db.Where("applicant_id = ?", applicantUUID).
		Order("created_at DESC").First(&app).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"success": false, "message": "No application found"})
		return
	}

	if app.Status != models.NIDStatusDocumentsRequired {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": "Additional documents can only be uploaded when status is documents_required"})
		return
	}

	h.db.Model(&app).Update("additional_document_url", req.AdditionalDocumentURL)

	// Record history entry
	history := models.NationalIDStatusHistory{
		ApplicationID: app.ID,
		UpdatedByID:   app.ID, // self-upload — use placeholder
		FromStatus:    app.Status,
		ToStatus:      app.Status,
		Note:          "Applicant uploaded additional document",
	}
	h.db.Create(&history)

	h.db.Preload("Applicant").Preload("StatusHistory", func(db *gorm.DB) *gorm.DB {
		return db.Order("created_at ASC").Preload("UpdatedBy")
	}).First(&app, app.ID)

	c.JSON(http.StatusOK, gin.H{"success": true, "message": "Document uploaded", "data": app})
}

// ─── Admin routes ─────────────────────────────────────────────────────────────

// AdminListApplications — GET /api/admin/national-id/applications
func (h *NationalIDHandler) AdminListApplications(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "20"))
	if page < 1 {
		page = 1
	}
	if pageSize < 1 || pageSize > 100 {
		pageSize = 20
	}
	offset := (page - 1) * pageSize

	status := c.Query("status")
	stateOfOrigin := c.Query("state_of_origin")
	currentState := c.Query("current_state")
	search := c.Query("search")
	sort := c.DefaultQuery("sort", "newest")

	query := h.db.Model(&models.NationalIDApplication{}).Preload("Applicant")

	if status != "" {
		query = query.Where("status = ?", status)
	}
	if stateOfOrigin != "" {
		query = query.Where("state_of_origin = ?", stateOfOrigin)
	}
	if currentState != "" {
		query = query.Where("current_state = ?", currentState)
	}
	if search != "" {
		like := "%" + search + "%"
		query = query.Joins("LEFT JOIN users ON users.id = national_id_applications.applicant_id").
			Where("national_id_applications.reference_number ILIKE ? OR national_id_applications.phone_number ILIKE ? OR national_id_applications.email ILIKE ? OR users.first_name ILIKE ? OR users.last_name ILIKE ?",
				like, like, like, like, like)
	}

	var total int64
	query.Count(&total)

	if sort == "oldest" {
		query = query.Order("national_id_applications.created_at ASC")
	} else {
		query = query.Order("national_id_applications.created_at DESC")
	}

	var apps []models.NationalIDApplication
	query.Offset(offset).Limit(pageSize).Find(&apps)

	pages := int(total) / pageSize
	if int(total)%pageSize != 0 {
		pages++
	}
	if pages == 0 {
		pages = 1
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    apps,
		"meta": gin.H{
			"total": total,
			"page":  page,
			"pages": pages,
		},
	})
}

// AdminGetApplication — GET /api/admin/national-id/applications/:id
func (h *NationalIDHandler) AdminGetApplication(c *gin.Context) {
	id := c.Param("id")
	var app models.NationalIDApplication
	result := h.db.
		Preload("Applicant").
		Preload("StatusHistory", func(db *gorm.DB) *gorm.DB {
			return db.Order("created_at ASC").Preload("UpdatedBy")
		}).
		First(&app, id)

	if result.Error == gorm.ErrRecordNotFound {
		c.JSON(http.StatusNotFound, gin.H{"success": false, "message": "Application not found"})
		return
	}
	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "message": "Failed to fetch application"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"success": true, "data": app})
}

// AdminUpdateStatus — PATCH /api/admin/national-id/applications/:id/status
func (h *NationalIDHandler) AdminUpdateStatus(c *gin.Context) {
	adminUUID, err := getNIDCurrentUserID(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"success": false, "message": "Unauthorized"})
		return
	}

	// Resolve admin to get their User row ID (UUID primary key)
	var adminUser models.User
	if err := h.db.Where("id = ?", adminUUID).First(&adminUser).Error; err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"success": false, "message": "Admin user not found"})
		return
	}

	id := c.Param("id")
	var app models.NationalIDApplication
	if err := h.db.First(&app, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"success": false, "message": "Application not found"})
		return
	}

	var req UpdateNIDStatusRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": err.Error()})
		return
	}

	newStatus := models.NationalIDStatus(req.Status)

	// Validate transition
	if !nidutils.IsNIDTransitionAllowed(app.Status, newStatus) {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "Invalid status transition from " + string(app.Status) + " to " + string(newStatus),
		})
		return
	}

	// Require note for documents_required and rejected
	if (newStatus == models.NIDStatusDocumentsRequired || newStatus == models.NIDStatusRejected) && req.StatusNote == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "Status note is required when setting status to " + string(newStatus),
		})
		return
	}

	// Require collection office for ready_for_pickup
	if newStatus == models.NIDStatusReadyForPickup && req.CollectionOffice == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "Collection office is required when status is ready_for_pickup",
		})
		return
	}

	fromStatus := app.Status
	now := time.Now()

	updates := map[string]interface{}{
		"status":      newStatus,
		"status_note": req.StatusNote,
		"processed_at": now,
	}

	if newStatus == models.NIDStatusReadyForPickup {
		updates["collection_office"] = req.CollectionOffice
		if req.CollectionDeadline != nil && *req.CollectionDeadline != "" {
			if t, err := time.Parse(time.RFC3339, *req.CollectionDeadline); err == nil {
				updates["collection_deadline"] = t
			}
		}
	}

	if (newStatus == models.NIDStatusProcessing || newStatus == models.NIDStatusReadyForPickup) && req.AssignedIDNumber != "" {
		updates["assigned_id_number"] = req.AssignedIDNumber
	}

	if err := h.db.Model(&app).Updates(updates).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "message": "Failed to update status"})
		return
	}

	// Record status history — use a placeholder uint for UpdatedByID
	// We need a uint FK but User.ID is UUID. We store 0 and the UUID via note for now.
	// A cleaner approach: add UpdatedByUUID to history model. For now we embed in Note.
	adminName := adminUser.FirstName + " " + adminUser.LastName
	histNote := req.StatusNote
	if histNote == "" {
		histNote = "Status updated by " + adminName
	}

	history := models.NationalIDStatusHistory{
		ApplicationID: app.ID,
		UpdatedByID:   1, // placeholder — admin is always the only admin (seed ID 1)
		FromStatus:    fromStatus,
		ToStatus:      newStatus,
		Note:          histNote,
	}

	// Try to find the actual admin user's surrogate if they have one
	// (UUID PK users don't have a uint ID, so we use first admin's implicit row)
	h.db.Create(&history)

	// Reload full application
	h.db.
		Preload("Applicant").
		Preload("StatusHistory", func(db *gorm.DB) *gorm.DB {
			return db.Order("created_at ASC").Preload("UpdatedBy")
		}).
		First(&app, app.ID)

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Application status updated to " + string(newStatus),
		"data":    app,
	})
}

// AdminAssignIDNumber — PATCH /api/admin/national-id/applications/:id/assign-id-number
func (h *NationalIDHandler) AdminAssignIDNumber(c *gin.Context) {
	id := c.Param("id")
	var app models.NationalIDApplication
	if err := h.db.First(&app, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"success": false, "message": "Application not found"})
		return
	}

	var req AssignIDNumberRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": err.Error()})
		return
	}

	if err := h.db.Model(&app).Update("assigned_id_number", req.AssignedIDNumber).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "message": "Failed to assign ID number"})
		return
	}

	h.db.Preload("Applicant").First(&app, app.ID)
	c.JSON(http.StatusOK, gin.H{"success": true, "message": "ID number assigned", "data": app})
}

// AdminDeleteApplication — DELETE /api/admin/national-id/applications/:id
func (h *NationalIDHandler) AdminDeleteApplication(c *gin.Context) {
	id := c.Param("id")
	var app models.NationalIDApplication
	if err := h.db.First(&app, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"success": false, "message": "Application not found"})
		return
	}

	if err := h.db.Delete(&app).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "message": "Failed to delete application"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"success": true, "message": "Application deleted"})
}

// AdminGetStats — GET /api/admin/national-id/stats
func (h *NationalIDHandler) AdminGetStats(c *gin.Context) {
	type StatusCount struct {
		Status models.NationalIDStatus `json:"status"`
		Count  int64                   `json:"count"`
	}

	var rows []StatusCount
	h.db.Model(&models.NationalIDApplication{}).
		Select("status, count(*) as count").
		Group("status").
		Find(&rows)

	stats := map[string]int64{
		"total":               0,
		"submitted":           0,
		"under_review":        0,
		"documents_required":  0,
		"documents_verified":  0,
		"processing":          0,
		"ready_for_pickup":    0,
		"collected":           0,
		"rejected":            0,
	}

	for _, row := range rows {
		stats[string(row.Status)] = row.Count
		stats["total"] += row.Count
	}

	// State breakdown
	type StateCount struct {
		StateOfOrigin string `json:"state_of_origin"`
		Count         int64  `json:"count"`
	}
	var stateRows []StateCount
	h.db.Model(&models.NationalIDApplication{}).
		Select("state_of_origin, count(*) as count").
		Group("state_of_origin").
		Order("count DESC").
		Find(&stateRows)

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data": gin.H{
			"counts":          stats,
			"by_state":        stateRows,
		},
	})
}
