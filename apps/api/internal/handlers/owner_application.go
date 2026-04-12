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

type OwnerApplicationHandler struct {
	db *gorm.DB
}

func NewOwnerApplicationHandler(db *gorm.DB) *OwnerApplicationHandler {
	return &OwnerApplicationHandler{db: db}
}

// POST /api/become-owner
func (h *OwnerApplicationHandler) Apply(c *gin.Context) {
	userIDStr, _ := c.Get("user_id")
	userID, _ := uuid.Parse(userIDStr.(string))

	// Check for existing pending/approved application
	var existing models.OwnerApplication
	if err := h.db.Where("user_id = ? AND status IN ?", userID, []string{"pending", "approved"}).First(&existing).Error; err == nil {
		c.JSON(http.StatusConflict, types.ErrorResponse{
			Success: false,
			Message: "You already have an active or approved application",
		})
		return
	}

	var req types.OwnerApplicationRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, types.ErrorResponse{
			Success: false,
			Message: "Validation failed",
			Error:   err.Error(),
		})
		return
	}

	app := models.OwnerApplication{
		UserID:       userID,
		BusinessName: req.BusinessName,
		BusinessType: req.BusinessType,
		PhoneNumber:  req.PhoneNumber,
		Address:      req.Address,
		City:         req.City,
		Description:  req.Description,
		DocumentURL:  req.DocumentURL,
		Status:       models.ApplicationPending,
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
		Message: "Application submitted successfully",
		Data:    app,
	})
}

// GET /api/admin/owner-applications
func (h *OwnerApplicationHandler) ListApplications(c *gin.Context) {
	status := c.Query("status")
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "20"))
	if page < 1 {
		page = 1
	}
	if pageSize < 1 || pageSize > 100 {
		pageSize = 20
	}
	offset := (page - 1) * pageSize

	query := h.db.Model(&models.OwnerApplication{}).Preload("User")
	if status != "" {
		query = query.Where("status = ?", status)
	}

	var total int64
	query.Count(&total)

	var apps []models.OwnerApplication
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

// GET /api/admin/owner-applications/:id
func (h *OwnerApplicationHandler) GetApplication(c *gin.Context) {
	id := c.Param("id")
	var app models.OwnerApplication
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

// PATCH /api/admin/owner-applications/:id/approve
func (h *OwnerApplicationHandler) ApproveApplication(c *gin.Context) {
	adminIDStr, _ := c.Get("user_id")
	adminID, _ := uuid.Parse(adminIDStr.(string))

	id := c.Param("id")
	var app models.OwnerApplication
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

	now := time.Now()
	app.Status = models.ApplicationApproved
	app.ReviewedBy = &adminID
	app.ReviewedAt = &now

	if err := h.db.Save(&app).Error; err != nil {
		c.JSON(http.StatusInternalServerError, types.ErrorResponse{
			Success: false,
			Message: "Failed to approve application",
		})
		return
	}

	// Upgrade user role to property_owner
	h.db.Model(&models.User{}).Where("id = ?", app.UserID).Update("role", models.RolePropertyOwner)

	h.db.Preload("User").First(&app, "id = ?", app.ID)

	c.JSON(http.StatusOK, types.SuccessResponse{
		Success: true,
		Message: "Application approved",
		Data:    app,
	})
}

// PATCH /api/admin/owner-applications/:id/reject
func (h *OwnerApplicationHandler) RejectApplication(c *gin.Context) {
	adminIDStr, _ := c.Get("user_id")
	adminID, _ := uuid.Parse(adminIDStr.(string))

	id := c.Param("id")
	var app models.OwnerApplication
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
			Message: "Only pending applications can be rejected",
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

	h.db.Preload("User").First(&app, "id = ?", app.ID)

	c.JSON(http.StatusOK, types.SuccessResponse{
		Success: true,
		Message: "Application rejected",
		Data:    app,
	})
}
