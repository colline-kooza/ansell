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

type SupplierHandler struct {
	db *gorm.DB
}

func NewSupplierHandler(db *gorm.DB) *SupplierHandler {
	return &SupplierHandler{db: db}
}

// POST /api/supplier/apply
func (h *SupplierHandler) Apply(c *gin.Context) {
	userIDStr, _ := c.Get("user_id")
	userID, _ := uuid.Parse(userIDStr.(string))

	// Check for existing pending/approved application
	var existing models.SupplierApplication
	if err := h.db.Where("user_id = ? AND status IN ?", userID, []string{"pending", "approved"}).First(&existing).Error; err == nil {
		c.JSON(http.StatusConflict, types.ErrorResponse{
			Success: false,
			Message: "You already have an active or approved supplier application",
		})
		return
	}

	var req types.SupplierApplicationRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, types.ErrorResponse{
			Success: false,
			Message: "Validation failed",
			Error:   err.Error(),
		})
		return
	}

	app := models.SupplierApplication{
		UserID:             userID,
		BusinessName:       req.BusinessName,
		BusinessType:       req.BusinessType,
		Industry:           req.Industry,
		RegistrationNumber: req.RegistrationNumber,
		PhoneNumber:        req.PhoneNumber,
		Email:              req.Email,
		Website:            req.Website,
		Address:            req.Address,
		City:               req.City,
		Description:        req.Description,
		LogoURL:            req.LogoURL,
		DocumentURL:        req.DocumentURL,
		EmployeeCount:      req.EmployeeCount,
		Status:             models.ApplicationPending,
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
		Message: "Supplier application submitted successfully",
		Data:    app,
	})
}

// GET /api/admin/supplier-applications
func (h *SupplierHandler) ListApplications(c *gin.Context) {
	status := c.Query("status")
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "20"))
	search := c.Query("search")

	if page < 1 {
		page = 1
	}
	offset := (page - 1) * pageSize

	query := h.db.Model(&models.SupplierApplication{}).Preload("User")
	if status != "" {
		query = query.Where("status = ?", status)
	}
	if search != "" {
		query = query.Joins("User").Where("business_name ILIKE ? OR User.first_name ILIKE ? OR User.last_name ILIKE ?", "%"+search+"%", "%"+search+"%", "%"+search+"%")
	}

	var total int64
	query.Count(&total)

	var apps []models.SupplierApplication
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

// GET /api/admin/supplier-applications/:id
func (h *SupplierHandler) GetApplication(c *gin.Context) {
	id := c.Param("id")
	var app models.SupplierApplication
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

// PATCH /api/admin/supplier-applications/:id/approve
func (h *SupplierHandler) ApproveApplication(c *gin.Context) {
	adminIDStr, _ := c.Get("user_id")
	adminID, _ := uuid.Parse(adminIDStr.(string))

	id := c.Param("id")
	var app models.SupplierApplication
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

		// Create Supplier record
		supplier := models.Supplier{
			OwnerID:            app.UserID,
			BusinessName:       app.BusinessName,
			BusinessType:       app.BusinessType,
			Industry:           app.Industry,
			RegistrationNumber: app.RegistrationNumber,
			PhoneNumber:        app.PhoneNumber,
			Email:              app.Email,
			Website:            app.Website,
			Address:            app.Address,
			City:               app.City,
			Description:        app.Description,
			LogoURL:            app.LogoURL,
			EmployeeCount:      app.EmployeeCount,
			IsActive:           true,
		}

		if err := tx.Create(&supplier).Error; err != nil {
			return err
		}

		// Upgrade user role to supplier
		if err := tx.Model(&models.User{}).Where("id = ?", app.UserID).Update("role", models.RoleSupplier).Error; err != nil {
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
		Message: "Supplier application approved",
		Data:    app,
	})
}

// PATCH /api/admin/supplier-applications/:id/reject
func (h *SupplierHandler) RejectApplication(c *gin.Context) {
	adminIDStr, _ := c.Get("user_id")
	adminID, _ := uuid.Parse(adminIDStr.(string))

	id := c.Param("id")
	var app models.SupplierApplication
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
		Message: "Supplier application rejected",
		Data:    app,
	})
}

// GET /api/admin/suppliers
func (h *SupplierHandler) ListAdminSuppliers(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "20"))
	search := c.Query("search")
	isVerified := c.Query("is_verified")
	city := c.Query("city")

	if page < 1 {
		page = 1
	}
	offset := (page - 1) * pageSize

	query := h.db.Model(&models.Supplier{}).Preload("Owner")
	if search != "" {
		query = query.Where("business_name ILIKE ?", "%"+search+"%")
	}
	if isVerified != "" {
		query = query.Where("is_verified = ?", isVerified == "true")
	}
	if city != "" {
		query = query.Where("city = ?", city)
	}

	var total int64
	query.Count(&total)

	var suppliers []models.Supplier
	if err := query.Order("created_at desc").Offset(offset).Limit(pageSize).Find(&suppliers).Error; err != nil {
		c.JSON(http.StatusInternalServerError, types.ErrorResponse{
			Success: false,
			Message: "Failed to fetch suppliers",
		})
		return
	}

	totalPages := int(total) / pageSize
	if int(total)%pageSize != 0 {
		totalPages++
	}

	c.JSON(http.StatusOK, types.PaginatedResponse{
		Success:    true,
		Message:    "Suppliers fetched",
		Data:       suppliers,
		Page:       page,
		PageSize:   pageSize,
		TotalItems: total,
		TotalPages: totalPages,
	})
}

// PATCH /api/admin/suppliers/:id/verify
func (h *SupplierHandler) VerifySupplier(c *gin.Context) {
	id := c.Param("id")
	var supplier models.Supplier
	if err := h.db.First(&supplier, "id = ?", id).Error; err != nil {
		c.JSON(http.StatusNotFound, types.ErrorResponse{
			Success: false,
			Message: "Supplier not found",
		})
		return
	}

	supplier.IsVerified = !supplier.IsVerified
	if err := h.db.Save(&supplier).Error; err != nil {
		c.JSON(http.StatusInternalServerError, types.ErrorResponse{
			Success: false,
			Message: "Failed to update verification",
		})
		return
	}

	c.JSON(http.StatusOK, types.SuccessResponse{
		Success: true,
		Message: "Supplier verification updated",
		Data:    supplier,
	})
}

// GET /api/supplier/profile
func (h *SupplierHandler) GetProfile(c *gin.Context) {
	userIDStr, _ := c.Get("user_id")
	userID, _ := uuid.Parse(userIDStr.(string))

	var supplier models.Supplier
	if err := h.db.First(&supplier, "owner_id = ?", userID).Error; err != nil {
		c.JSON(http.StatusNotFound, types.ErrorResponse{
			Success: false,
			Message: "Supplier profile not found",
		})
		return
	}

	c.JSON(http.StatusOK, types.SuccessResponse{
		Success: true,
		Message: "Supplier profile fetched",
		Data:    supplier,
	})
}

// PUT /api/supplier/profile
func (h *SupplierHandler) UpdateProfile(c *gin.Context) {
	userIDStr, _ := c.Get("user_id")
	userID, _ := uuid.Parse(userIDStr.(string))

	var supplier models.Supplier
	if err := h.db.First(&supplier, "owner_id = ?", userID).Error; err != nil {
		c.JSON(http.StatusNotFound, types.ErrorResponse{
			Success: false,
			Message: "Supplier profile not found",
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

	// Filter out restricted fields
	delete(req, "id")
	delete(req, "owner_id")
	delete(req, "is_verified")
	delete(req, "created_at")
	delete(req, "updated_at")
	delete(req, "deleted_at")

	if err := h.db.Model(&supplier).Updates(req).Error; err != nil {
		c.JSON(http.StatusInternalServerError, types.ErrorResponse{
			Success: false,
			Message: "Failed to update supplier profile",
		})
		return
	}

	c.JSON(http.StatusOK, types.SuccessResponse{
		Success: true,
		Message: "Supplier profile updated",
		Data:    supplier,
	})
}
