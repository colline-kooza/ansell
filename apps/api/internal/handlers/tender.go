package handlers

import (
	"net/http"
	"strconv"
	"time"

	"ansell-backend-api/internal/models"
	"ansell-backend-api/internal/types"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type TenderHandler struct {
	db *gorm.DB
}

func NewTenderHandler(db *gorm.DB) *TenderHandler {
	return &TenderHandler{db: db}
}

// ----------------------------------------------------------------------------
// PUBLIC TENDER ROUTES
// ----------------------------------------------------------------------------

// GET /api/tenders
func (h *TenderHandler) ListPublicTenders(c *gin.Context) {
	category := c.Query("category")
	tenderType := c.Query("tender_type")
	city := c.Query("city")
	status := c.DefaultQuery("status", "active")
	isFeatured := c.Query("is_featured")
	closingSoon := c.Query("closing_soon")
	organisation := c.Query("issuing_organisation")
	search := c.Query("search")
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "20"))

	if page < 1 {
		page = 1
	}
	offset := (page - 1) * pageSize

	query := h.db.Model(&models.Tender{}).Preload("Company")

	if status != "" {
		query = query.Where("status = ?", status)
	}
	if category != "" {
		query = query.Where("category = ?", category)
	}
	if tenderType != "" {
		query = query.Where("tender_type = ?", tenderType)
	}
	if city != "" {
		query = query.Where("city = ?", city)
	}
	if isFeatured == "true" {
		query = query.Where("is_featured = ?", true)
	}
	if organisation != "" {
		query = query.Where("issuing_organisation = ?", organisation)
	}
	if search != "" {
		query = query.Where("title ILIKE ? OR issuing_organisation ILIKE ? OR reference_number ILIKE ?", "%"+search+"%", "%"+search+"%", "%"+search+"%")
	}
	if closingSoon == "true" {
		sevenDaysFromNow := time.Now().AddDate(0, 0, 7)
		query = query.Where("submission_deadline > ? AND submission_deadline <= ?", time.Now(), sevenDaysFromNow)
	}

	var total int64
	query.Count(&total)

	var tenders []models.Tender
	if err := query.Order("submission_deadline asc").Offset(offset).Limit(pageSize).Find(&tenders).Error; err != nil {
		c.JSON(http.StatusInternalServerError, types.ErrorResponse{
			Success: false,
			Message: "Failed to fetch tenders",
		})
		return
	}

	totalPages := int(total) / pageSize
	if int(total)%pageSize != 0 {
		totalPages++
	}

	c.JSON(http.StatusOK, types.PaginatedResponse{
		Success:    true,
		Message:    "Tenders fetched",
		Data:       tenders,
		Page:       page,
		PageSize:   pageSize,
		TotalItems: total,
		TotalPages: totalPages,
	})
}

// GET /api/tenders/:id
func (h *TenderHandler) GetPublicTender(c *gin.Context) {
	id := c.Param("id")
	var tender models.Tender
	if err := h.db.Preload("Company").First(&tender, "id = ?", id).Error; err != nil {
		c.JSON(http.StatusNotFound, types.ErrorResponse{
			Success: false,
			Message: "Tender not found",
		})
		return
	}

	// Increment views
	h.db.Model(&tender).UpdateColumn("views", gorm.Expr("views + ?", 1))

	c.JSON(http.StatusOK, types.SuccessResponse{
		Success: true,
		Message: "Tender fetched",
		Data:    tender,
	})
}

// GET /api/tenders/categories
func (h *TenderHandler) GetCategories(c *gin.Context) {
	type Result struct {
		Category string `json:"category"`
		Count    int    `json:"count"`
	}
	var results []Result

	h.db.Model(&models.Tender{}).Where("status = ?", "active").Select("category, count(id) as count").Group("category").Scan(&results)

	c.JSON(http.StatusOK, types.SuccessResponse{
		Success: true,
		Message: "Categories fetched",
		Data:    results,
	})
}

// GET /api/tenders/closing-soon
func (h *TenderHandler) GetClosingSoon(c *gin.Context) {
	sevenDaysFromNow := time.Now().AddDate(0, 0, 7)
	var tenders []models.Tender

	if err := h.db.Where("status = ? AND submission_deadline > ? AND submission_deadline <= ?", "active", time.Now(), sevenDaysFromNow).Order("submission_deadline asc").Find(&tenders).Error; err != nil {
		c.JSON(http.StatusInternalServerError, types.ErrorResponse{
			Success: false,
			Message: "Failed to fetch closing soon tenders",
		})
		return
	}

	c.JSON(http.StatusOK, types.SuccessResponse{
		Success: true,
		Message: "Closing soon tenders fetched",
		Data:    tenders,
	})
}

// ----------------------------------------------------------------------------
// SUPPLIER ROUTES
// ----------------------------------------------------------------------------

// GET /api/supplier/bids
func (h *TenderHandler) ListSupplierBids(c *gin.Context) {
	userIDStr, _ := c.Get("user_id")
	userID, _ := uuid.Parse(userIDStr.(string))

	// Get supplier
	var supplier models.Supplier
	if err := h.db.First(&supplier, "owner_id = ?", userID).Error; err != nil {
		c.JSON(http.StatusNotFound, types.ErrorResponse{
			Success: false,
			Message: "Supplier profile not found",
		})
		return
	}

	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "20"))
	status := c.Query("status")

	if page < 1 {
		page = 1
	}
	offset := (page - 1) * pageSize

	query := h.db.Model(&models.TenderBid{}).Preload("Tender").Where("supplier_id = ?", supplier.ID)
	if status != "" {
		query = query.Where("status = ?", status)
	}

	var total int64
	query.Count(&total)

	var bids []models.TenderBid
	if err := query.Order("created_at desc").Offset(offset).Limit(pageSize).Find(&bids).Error; err != nil {
		c.JSON(http.StatusInternalServerError, types.ErrorResponse{
			Success: false,
			Message: "Failed to fetch bids",
		})
		return
	}

	totalPages := int(total) / pageSize
	if int(total)%pageSize != 0 {
		totalPages++
	}

	c.JSON(http.StatusOK, types.PaginatedResponse{
		Success:    true,
		Message:    "Bids fetched",
		Data:       bids,
		Page:       page,
		PageSize:   pageSize,
		TotalItems: total,
		TotalPages: totalPages,
	})
}

// POST /api/tenders/:id/bid
func (h *TenderHandler) SubmitBid(c *gin.Context) {
	userIDStr, _ := c.Get("user_id")
	userID, _ := uuid.Parse(userIDStr.(string))

	tenderID := c.Param("id")

	// Verify supplier exists
	var supplier models.Supplier
	if err := h.db.First(&supplier, "owner_id = ?", userID).Error; err != nil {
		c.JSON(http.StatusNotFound, types.ErrorResponse{
			Success: false,
			Message: "Only registered suppliers can submit bids",
		})
		return
	}

	// Fetch Tender
	var tender models.Tender
	if err := h.db.First(&tender, "id = ?", tenderID).Error; err != nil {
		c.JSON(http.StatusNotFound, types.ErrorResponse{
			Success: false,
			Message: "Tender not found",
		})
		return
	}

	if tender.Status != "active" || (tender.SubmissionDeadline != nil && tender.SubmissionDeadline.Before(time.Now())) {
		c.JSON(http.StatusBadRequest, types.ErrorResponse{
			Success: false,
			Message: "This tender is officially closed for submissions",
		})
		return
	}

	// Check for duplicate bid
	var existingBid models.TenderBid
	if err := h.db.Where("tender_id = ? AND supplier_id = ?", tenderID, supplier.ID).First(&existingBid).Error; err == nil {
		c.JSON(http.StatusConflict, types.ErrorResponse{
			Success: false,
			Message: "You have already submitted a bid for this tender",
		})
		return
	}

	var req types.SubmitBidRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, types.ErrorResponse{
			Success: false,
			Message: "Validation failed",
		})
		return
	}

	err := h.db.Transaction(func(tx *gorm.DB) error {
		bid := models.TenderBid{
			TenderID:              tender.ID,
			SupplierID:            supplier.ID,
			BidAmount:             req.BidAmount,
			BidCurrency:           req.BidCurrency,
			TechnicalProposalURL:  req.TechnicalProposalURL,
			FinancialProposalURL:  req.FinancialProposalURL,
			AdditionalDocumentURL: req.AdditionalDocumentURL,
			CoverLetter:           req.CoverLetter,
			CompanyProfile:        req.CompanyProfile,
			YearsInBusiness:       req.YearsInBusiness,
			PreviousContracts:     req.PreviousContracts,
			Status:                "submitted",
		}

		if err := tx.Create(&bid).Error; err != nil {
			return err
		}

		if err := tx.Model(&tender).UpdateColumn("bid_count", gorm.Expr("bid_count + ?", 1)).Error; err != nil {
			return err
		}

		return nil
	})

	if err != nil {
		c.JSON(http.StatusInternalServerError, types.ErrorResponse{
			Success: false,
			Message: "Failed to submit bid",
		})
		return
	}

	c.JSON(http.StatusCreated, types.SuccessResponse{
		Success: true,
		Message: "Bid submitted successfully",
	})
}

// ----------------------------------------------------------------------------
// SUPER ADMIN TENDER ROUTES
// ----------------------------------------------------------------------------

// GET /api/admin/tenders
func (h *TenderHandler) ListAdminTenders(c *gin.Context) {
	status := c.Query("status")
	category := c.Query("category")
	city := c.Query("city")
	search := c.Query("search")

	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "20"))

	if page < 1 {
		page = 1
	}
	offset := (page - 1) * pageSize

	query := h.db.Model(&models.Tender{})
	if status != "" {
		query = query.Where("status = ?", status)
	}
	if category != "" {
		query = query.Where("category = ?", category)
	}
	if city != "" {
		query = query.Where("city = ?", city)
	}
	if search != "" {
		query = query.Where("title ILIKE ? OR reference_number ILIKE ? OR issuing_organisation ILIKE ?", "%"+search+"%", "%"+search+"%", "%"+search+"%")
	}

	var total int64
	query.Count(&total)

	var tenders []models.Tender
	if err := query.Order("created_at desc").Offset(offset).Limit(pageSize).Find(&tenders).Error; err != nil {
		c.JSON(http.StatusInternalServerError, types.ErrorResponse{
			Success: false,
			Message: "Failed to fetch tenders",
		})
		return
	}

	totalPages := int(total) / pageSize
	if int(total)%pageSize != 0 {
		totalPages++
	}

	c.JSON(http.StatusOK, types.PaginatedResponse{
		Success:    true,
		Message:    "Tenders fetched",
		Data:       tenders,
		Page:       page,
		PageSize:   pageSize,
		TotalItems: total,
		TotalPages: totalPages,
	})
}

// POST /api/admin/tenders
func (h *TenderHandler) CreateTender(c *gin.Context) {
	adminIDStr, _ := c.Get("user_id")
	adminID, _ := uuid.Parse(adminIDStr.(string))

	var req types.CreateTenderRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, types.ErrorResponse{
			Success: false,
			Message: "Validation failed",
		})
		return
	}

	status := "pending_review"
	if req.Status != "" {
		status = req.Status
	}

	tender := models.Tender{
		PostedByID:              adminID,
		IssuingOrganisation:     req.IssuingOrganisation,
		IssuingOrganisationLogo: req.IssuingOrganisationLogo,
		Title:                   req.Title,
		ReferenceNumber:         req.ReferenceNumber,
		Description:             req.Description,
		Category:                req.Category,
		TenderType:              req.TenderType,
		ValueEstimate:           req.ValueEstimate,
		ValueCurrency:           req.ValueCurrency,
		City:                    req.City,
		Location:                req.Location,
		EligibilityCriteria:     req.EligibilityCriteria,
		RequiredDocuments:       req.RequiredDocuments,
		SubmissionDeadline:      req.SubmissionDeadline,
		TenderOpenDate:          req.TenderOpenDate,
		BidOpeningDate:          req.BidOpeningDate,
		ContactPerson:           req.ContactPerson,
		ContactEmail:            req.ContactEmail,
		ContactPhone:            req.ContactPhone,
		AttachmentURL:           req.AttachmentURL,
		IsFeatured:              req.IsFeatured,
		Status:                  status,
		IsActive:                true,
	}

	if err := h.db.Create(&tender).Error; err != nil {
		c.JSON(http.StatusInternalServerError, types.ErrorResponse{
			Success: false,
			Message: "Failed to create tender",
		})
		return
	}

	c.JSON(http.StatusCreated, types.SuccessResponse{
		Success: true,
		Message: "Tender created successfully",
		Data:    tender,
	})
}

// PUT /api/admin/tenders/:id
func (h *TenderHandler) UpdateTender(c *gin.Context) {
	id := c.Param("id")
	var tender models.Tender
	if err := h.db.First(&tender, "id = ?", id).Error; err != nil {
		c.JSON(http.StatusNotFound, types.ErrorResponse{
			Success: false,
			Message: "Tender not found",
		})
		return
	}

	var req types.UpdateTenderRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, types.ErrorResponse{
			Success: false,
			Message: "Validation failed",
		})
		return
	}

	if req.IssuingOrganisation != "" { tender.IssuingOrganisation = req.IssuingOrganisation }
	if req.IssuingOrganisationLogo != "" { tender.IssuingOrganisationLogo = req.IssuingOrganisationLogo }
	if req.Title != "" { tender.Title = req.Title }
	if req.ReferenceNumber != "" { tender.ReferenceNumber = req.ReferenceNumber }
	if req.Description != "" { tender.Description = req.Description }
	if req.Category != "" { tender.Category = req.Category }
	if req.TenderType != "" { tender.TenderType = req.TenderType }
	if req.ValueEstimate != nil { tender.ValueEstimate = req.ValueEstimate }
	if req.ValueCurrency != "" { tender.ValueCurrency = req.ValueCurrency }
	if req.City != "" { tender.City = req.City }
	if req.Location != "" { tender.Location = req.Location }
	if req.EligibilityCriteria != "" { tender.EligibilityCriteria = req.EligibilityCriteria }
	if req.RequiredDocuments != "" { tender.RequiredDocuments = req.RequiredDocuments }
	if req.SubmissionDeadline != nil { tender.SubmissionDeadline = req.SubmissionDeadline }
	if req.TenderOpenDate != nil { tender.TenderOpenDate = req.TenderOpenDate }
	if req.BidOpeningDate != nil { tender.BidOpeningDate = req.BidOpeningDate }
	if req.ContactPerson != "" { tender.ContactPerson = req.ContactPerson }
	if req.ContactEmail != "" { tender.ContactEmail = req.ContactEmail }
	if req.ContactPhone != "" { tender.ContactPhone = req.ContactPhone }
	if req.AttachmentURL != "" { tender.AttachmentURL = req.AttachmentURL }
	if req.IsFeatured != nil { tender.IsFeatured = *req.IsFeatured }
	if req.Status != "" { tender.Status = req.Status }

	if err := h.db.Save(&tender).Error; err != nil {
		c.JSON(http.StatusInternalServerError, types.ErrorResponse{
			Success: false,
			Message: "Failed to update tender",
		})
		return
	}

	c.JSON(http.StatusOK, types.SuccessResponse{
		Success: true,
		Message: "Tender updated",
		Data:    tender,
	})
}

// DELETE /api/admin/tenders/:id
func (h *TenderHandler) DeleteTender(c *gin.Context) {
	id := c.Param("id")
	if err := h.db.Delete(&models.Tender{}, "id = ?", id).Error; err != nil {
		c.JSON(http.StatusInternalServerError, types.ErrorResponse{
			Success: false,
			Message: "Failed to delete tender",
		})
		return
	}

	c.JSON(http.StatusOK, types.SuccessResponse{
		Success: true,
		Message: "Tender deleted",
	})
}

// PATCH /api/admin/tenders/:id/approve
func (h *TenderHandler) ApproveTender(c *gin.Context) {
	id := c.Param("id")
	if err := h.db.Model(&models.Tender{}).Where("id = ?", id).Update("status", "active").Error; err != nil {
		c.JSON(http.StatusInternalServerError, types.ErrorResponse{
			Success: false,
			Message: "Failed to approve tender",
		})
		return
	}
	c.JSON(http.StatusOK, types.SuccessResponse{Success: true, Message: "Tender approved"})
}

// PATCH /api/admin/tenders/:id/reject
func (h *TenderHandler) RejectTender(c *gin.Context) {
	id := c.Param("id")
	// Add review note if provided
	if err := h.db.Model(&models.Tender{}).Where("id = ?", id).Update("status", "cancelled").Error; err != nil {
		c.JSON(http.StatusInternalServerError, types.ErrorResponse{
			Success: false,
			Message: "Failed to reject tender",
		})
		return
	}
	c.JSON(http.StatusOK, types.SuccessResponse{Success: true, Message: "Tender cancelled"})
}

// PATCH /api/admin/tenders/:id/feature
func (h *TenderHandler) FeatureTender(c *gin.Context) {
	id := c.Param("id")
	var tender models.Tender
	if err := h.db.First(&tender, "id = ?", id).Error; err != nil {
		c.JSON(http.StatusNotFound, types.ErrorResponse{Success: false, Message: "Tender not found"})
		return
	}
	if err := h.db.Model(&tender).Update("is_featured", !tender.IsFeatured).Error; err != nil {
		c.JSON(http.StatusInternalServerError, types.ErrorResponse{Success: false, Message: "Failed to update feature status"})
		return
	}
	c.JSON(http.StatusOK, types.SuccessResponse{Success: true, Message: "Feature status updated"})
}

// PATCH /api/admin/tenders/:id/close
func (h *TenderHandler) CloseTender(c *gin.Context) {
	id := c.Param("id")
	if err := h.db.Model(&models.Tender{}).Where("id = ?", id).Update("status", "closed").Error; err != nil {
		c.JSON(http.StatusInternalServerError, types.ErrorResponse{Success: false, Message: "Failed to close tender"})
		return
	}
	c.JSON(http.StatusOK, types.SuccessResponse{Success: true, Message: "Tender closed"})
}

// PATCH /api/admin/tenders/:id/award
func (h *TenderHandler) AwardTender(c *gin.Context) {
	id := c.Param("id")
	if err := h.db.Model(&models.Tender{}).Where("id = ?", id).Update("status", "awarded").Error; err != nil {
		c.JSON(http.StatusInternalServerError, types.ErrorResponse{Success: false, Message: "Failed to award tender"})
		return
	}
	c.JSON(http.StatusOK, types.SuccessResponse{Success: true, Message: "Tender awarded"})
}

// ----------------------------------------------------------------------------
// SUPER ADMIN BID ROUTES
// ----------------------------------------------------------------------------

// GET /api/admin/bids
func (h *TenderHandler) ListAdminBids(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "20"))
	tenderID := c.Query("tender_id")
	supplierID := c.Query("supplier_id")
	status := c.Query("status")

	if page < 1 {
		page = 1
	}
	offset := (page - 1) * pageSize

	query := h.db.Model(&models.TenderBid{}).Preload("Tender").Preload("Supplier")
	if tenderID != "" {
		query = query.Where("tender_id = ?", tenderID)
	}
	if supplierID != "" {
		query = query.Where("supplier_id = ?", supplierID)
	}
	if status != "" {
		query = query.Where("status = ?", status)
	}

	var total int64
	query.Count(&total)

	var bids []models.TenderBid
	if err := query.Order("created_at desc").Offset(offset).Limit(pageSize).Find(&bids).Error; err != nil {
		c.JSON(http.StatusInternalServerError, types.ErrorResponse{Success: false, Message: "Failed to fetch bids"})
		return
	}

	totalPages := int(total) / pageSize
	if int(total)%pageSize != 0 {
		totalPages++
	}

	c.JSON(http.StatusOK, types.PaginatedResponse{
		Success:    true,
		Message:    "Bids fetched",
		Data:       bids,
		Page:       page,
		PageSize:   pageSize,
		TotalItems: total,
		TotalPages: totalPages,
	})
}

// GET /api/admin/bids/:id
func (h *TenderHandler) GetAdminBid(c *gin.Context) {
	id := c.Param("id")
	var bid models.TenderBid
	if err := h.db.Preload("Tender").Preload("Supplier").First(&bid, "id = ?", id).Error; err != nil {
		c.JSON(http.StatusNotFound, types.ErrorResponse{Success: false, Message: "Bid not found"})
		return
	}
	c.JSON(http.StatusOK, types.SuccessResponse{Success: true, Message: "Bid fetched", Data: bid})
}

// PATCH /api/admin/bids/:id/status
func (h *TenderHandler) UpdateBidStatus(c *gin.Context) {
	id := c.Param("id")
	var req types.UpdateApplicationStatusRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, types.ErrorResponse{Success: false, Message: "Validation failed"})
		return
	}

	if err := h.db.Model(&models.TenderBid{}).Where("id = ?", id).Updates(map[string]interface{}{
		"status":      req.Status,
		"review_note": req.ReviewNote,
	}).Error; err != nil {
		c.JSON(http.StatusInternalServerError, types.ErrorResponse{Success: false, Message: "Failed to update bid status"})
		return
	}

	c.JSON(http.StatusOK, types.SuccessResponse{Success: true, Message: "Bid status updated"})
}
