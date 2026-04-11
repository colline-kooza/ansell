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

type CompanyHandler struct {
	db *gorm.DB
}

func NewCompanyHandler(db *gorm.DB) *CompanyHandler {
	return &CompanyHandler{db: db}
}

// POST /api/company/apply
func (h *CompanyHandler) Apply(c *gin.Context) {
	userIDStr, _ := c.Get("user_id")
	userID, _ := uuid.Parse(userIDStr.(string))

	// Check for existing pending/approved application
	var existing models.CompanyApplication
	if err := h.db.Where("user_id = ? AND status IN ?", userID, []string{"pending", "approved"}).First(&existing).Error; err == nil {
		c.JSON(http.StatusConflict, types.ErrorResponse{
			Success: false,
			Message: "You already have an active or approved company application",
		})
		return
	}

	var req types.CompanyApplicationRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, types.ErrorResponse{
			Success: false,
			Message: "Validation failed",
			Error:   err.Error(),
		})
		return
	}

	app := models.CompanyApplication{
		UserID:        userID,
		CompanyName:   req.CompanyName,
		CompanyType:   req.CompanyType,
		Industry:      req.Industry,
		PhoneNumber:   req.PhoneNumber,
		Email:         req.Email,
		Website:       req.Website,
		Address:       req.Address,
		City:          req.City,
		Description:   req.Description,
		LogoURL:       req.LogoURL,
		DocumentURL:   req.DocumentURL,
		EmployeeCount: req.EmployeeCount,
		Status:        models.ApplicationPending,
	}

	if err := h.db.Create(&app).Error; err != nil {
		c.JSON(http.StatusInternalServerError, types.ErrorResponse{
			Success: false,
			Message: "Failed to submit application",
		})
		return
	}

	h.db.Preload("User").First(&app, "id = ?", app.ID)

	c.JSON(http.StatusCreated, types.SuccessResponse{
		Success: true,
		Message: "Company application submitted successfully",
		Data:    app,
	})
}

// GET /api/admin/company-applications
func (h *CompanyHandler) ListApplications(c *gin.Context) {
	status := c.Query("status")
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "20"))
	search := c.Query("search")

	if page < 1 {
		page = 1
	}
	offset := (page - 1) * pageSize

	query := h.db.Model(&models.CompanyApplication{}).Preload("User")
	if status != "" {
		query = query.Where("status = ?", status)
	}
	if search != "" {
		query = query.Where("company_name ILIKE ?", "%"+search+"%")
	}

	var total int64
	query.Count(&total)

	var apps []models.CompanyApplication
	if err := query.Order("created_at desc").Offset(offset).Limit(pageSize).Find(&apps).Error; err != nil {
		c.JSON(http.StatusInternalServerError, types.ErrorResponse{
			Success: false,
			Message: "Failed to fetch applications",
		})
		return
	}

	totalPages := int(total) / pageSize
	if int(total)%pageSize != 0 {
		totalPages++
	}

	c.JSON(http.StatusOK, types.PaginatedResponse{
		Success:    true,
		Message:    "Applications fetched",
		Data:       apps,
		Page:       page,
		PageSize:   pageSize,
		TotalItems: total,
		TotalPages: totalPages,
	})
}

// GET /api/admin/company-applications/:id
func (h *CompanyHandler) GetApplication(c *gin.Context) {
	id := c.Param("id")
	var app models.CompanyApplication
	if err := h.db.Preload("User").First(&app, "id = ?", id).Error; err != nil {
		c.JSON(http.StatusNotFound, types.ErrorResponse{
			Success: false,
			Message: "Application not found",
		})
		return
	}

	c.JSON(http.StatusOK, types.SuccessResponse{
		Success: true,
		Message: "Application fetched",
		Data:    app,
	})
}

// PATCH /api/admin/company-applications/:id/approve
func (h *CompanyHandler) ApproveApplication(c *gin.Context) {
	adminIDStr, _ := c.Get("user_id")
	adminID, _ := uuid.Parse(adminIDStr.(string))

	id := c.Param("id")
	var app models.CompanyApplication
	if err := h.db.Preload("User").First(&app, "id = ?", id).Error; err != nil {
		c.JSON(http.StatusNotFound, types.ErrorResponse{
			Success: false,
			Message: "Application not found",
		})
		return
	}

	if app.Status != models.ApplicationPending {
		c.JSON(http.StatusBadRequest, types.ErrorResponse{
			Success: false,
			Message: "Only pending applications can be approved",
		})
		return
	}

	err := h.db.Transaction(func(tx *gorm.DB) error {
		now := time.Now()
		app.Status = models.ApplicationApproved
		app.ReviewedBy = &adminID
		app.ReviewedAt = &now

		if err := tx.Save(&app).Error; err != nil {
			return err
		}

		// Create Company record
		company := models.Company{
			OwnerID:       app.UserID,
			CompanyName:   app.CompanyName,
			CompanyType:   app.CompanyType,
			Industry:      app.Industry,
			PhoneNumber:   app.PhoneNumber,
			Email:         app.Email,
			Website:       app.Website,
			Address:       app.Address,
			City:          app.City,
			Description:   app.Description,
			LogoURL:       app.LogoURL,
			EmployeeCount: app.EmployeeCount,
			IsActive:      true,
		}

		if err := tx.Create(&company).Error; err != nil {
			return err
		}

		// Upgrade user role
		if err := tx.Model(&models.User{}).Where("id = ?", app.UserID).Update("role", models.RoleCompanyOwner).Error; err != nil {
			return err
		}

		return nil
	})

	if err != nil {
		c.JSON(http.StatusInternalServerError, types.ErrorResponse{
			Success: false,
			Message: "Failed to approve application",
			Error:   err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, types.SuccessResponse{
		Success: true,
		Message: "Company application approved",
		Data:    app,
	})
}

// PATCH /api/admin/company-applications/:id/reject
func (h *CompanyHandler) RejectApplication(c *gin.Context) {
	adminIDStr, _ := c.Get("user_id")
	adminID, _ := uuid.Parse(adminIDStr.(string))

	id := c.Param("id")
	var app models.CompanyApplication
	if err := h.db.First(&app, "id = ?", id).Error; err != nil {
		c.JSON(http.StatusNotFound, types.ErrorResponse{
			Success: false,
			Message: "Application not found",
		})
		return
	}

	var req types.ReviewApplicationRequest
	c.ShouldBindJSON(&req)

	now := time.Now()
	app.Status = models.ApplicationRejected
	app.ReviewNote = req.ReviewNote
	app.ReviewedBy = &adminID
	app.ReviewedAt = &now

	if err := h.db.Save(&app).Error; err != nil {
		c.JSON(http.StatusInternalServerError, types.ErrorResponse{
			Success: false,
			Message: "Failed to reject application",
		})
		return
	}

	c.JSON(http.StatusOK, types.SuccessResponse{
		Success: true,
		Message: "Company application rejected",
		Data:    app,
	})
}

// GET /api/admin/companies
func (h *CompanyHandler) ListAdminCompanies(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "20"))
	search := c.Query("search")
	isVerified := c.Query("is_verified")

	if page < 1 {
		page = 1
	}
	offset := (page - 1) * pageSize

	query := h.db.Model(&models.Company{}).Preload("Owner")
	if search != "" {
		query = query.Where("company_name ILIKE ?", "%"+search+"%")
	}
	if isVerified != "" {
		query = query.Where("is_verified = ?", isVerified == "true")
	}

	var total int64
	query.Count(&total)

	var companies []models.Company
	if err := query.Order("created_at desc").Offset(offset).Limit(pageSize).Find(&companies).Error; err != nil {
		c.JSON(http.StatusInternalServerError, types.ErrorResponse{
			Success: false,
			Message: "Failed to fetch companies",
		})
		return
	}

	totalPages := int(total) / pageSize
	if int(total)%pageSize != 0 {
		totalPages++
	}

	c.JSON(http.StatusOK, types.PaginatedResponse{
		Success:    true,
		Message:    "Companies fetched",
		Data:       companies,
		Page:       page,
		PageSize:   pageSize,
		TotalItems: total,
		TotalPages: totalPages,
	})
}

// PATCH /api/admin/companies/:id/verify
func (h *CompanyHandler) VerifyCompany(c *gin.Context) {
	id := c.Param("id")
	var company models.Company
	if err := h.db.First(&company, "id = ?", id).Error; err != nil {
		c.JSON(http.StatusNotFound, types.ErrorResponse{
			Success: false,
			Message: "Company not found",
		})
		return
	}

	company.IsVerified = !company.IsVerified
	if err := h.db.Save(&company).Error; err != nil {
		c.JSON(http.StatusInternalServerError, types.ErrorResponse{
			Success: false,
			Message: "Failed to update verification",
		})
		return
	}

	c.JSON(http.StatusOK, types.SuccessResponse{
		Success: true,
		Message: "Company verification updated",
		Data:    company,
	})
}

// GET /api/owner/company
func (h *CompanyHandler) GetOwnerCompany(c *gin.Context) {
	userIDStr, _ := c.Get("user_id")
	userID, _ := uuid.Parse(userIDStr.(string))

	var company models.Company
	if err := h.db.First(&company, "owner_id = ?", userID).Error; err != nil {
		c.JSON(http.StatusNotFound, types.ErrorResponse{
			Success: false,
			Message: "Company not found",
		})
		return
	}

	c.JSON(http.StatusOK, types.SuccessResponse{
		Success: true,
		Message: "Company fetched",
		Data:    company,
	})
}

// PUT /api/owner/company
func (h *CompanyHandler) UpdateOwnerCompany(c *gin.Context) {
	userIDStr, _ := c.Get("user_id")
	userID, _ := uuid.Parse(userIDStr.(string))

	var company models.Company
	if err := h.db.First(&company, "owner_id = ?", userID).Error; err != nil {
		c.JSON(http.StatusNotFound, types.ErrorResponse{
			Success: false,
			Message: "Company not found",
		})
		return
	}

	var req map[string]interface{}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, types.ErrorResponse{
			Success: false,
			Message: "Invalid request body",
		})
		return
	}

	// Filter out fields that cannot be updated
	delete(req, "id")
	delete(req, "owner_id")
	delete(req, "is_verified")
	delete(req, "created_at")
	delete(req, "updated_at")
	delete(req, "deleted_at")

	if err := h.db.Model(&company).Updates(req).Error; err != nil {
		c.JSON(http.StatusInternalServerError, types.ErrorResponse{
			Success: false,
			Message: "Failed to update company",
		})
		return
	}

	c.JSON(http.StatusOK, types.SuccessResponse{
		Success: true,
		Message: "Company updated",
		Data:    company,
	})
}

// GET /api/companies
func (h *CompanyHandler) ListPublicCompanies(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "20"))
	search := c.Query("search")
	isFeatured := c.Query("is_featured")

	if page < 1 {
		page = 1
	}
	offset := (page - 1) * pageSize

	query := h.db.Model(&models.Company{}).Where("is_active = ?", true)
	if search != "" {
		query = query.Where("company_name ILIKE ?", "%"+search+"%")
	}
	if isFeatured == "true" {
        // if there was an is_featured column, we'd query it. 
		// Just simple query for now.
	}

	var total int64
	query.Count(&total)

	var companies []models.Company
	if err := query.Order("created_at desc").Offset(offset).Limit(pageSize).Find(&companies).Error; err != nil {
		c.JSON(http.StatusInternalServerError, types.ErrorResponse{
			Success: false,
			Message: "Failed to fetch companies",
		})
		return
	}

	totalPages := int(total) / pageSize
	if int(total)%pageSize != 0 {
		totalPages++
	}

	c.JSON(http.StatusOK, types.PaginatedResponse{
		Success:    true,
		Message:    "Companies fetched",
		Data:       companies,
		Page:       page,
		PageSize:   pageSize,
		TotalItems: total,
		TotalPages: totalPages,
	})
}

// GET /api/companies/:id
func (h *CompanyHandler) GetPublicCompany(c *gin.Context) {
	idStr := c.Param("id")
	
	id, err := uuid.Parse(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, types.ErrorResponse{
			Success: false,
			Message: "Invalid company ID format",
		})
		return
	}

	var company models.Company
	if err := h.db.Where("id = ? AND is_active = ?", id, true).First(&company).Error; err != nil {
		c.JSON(http.StatusNotFound, types.ErrorResponse{
			Success: false,
			Message: "Company not found",
		})
		return
	}

	c.JSON(http.StatusOK, types.SuccessResponse{
		Success: true,
		Message: "Company fetched",
		Data:    company,
	})
}
