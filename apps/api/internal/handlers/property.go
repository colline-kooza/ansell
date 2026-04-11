package handlers

import (
	"net/http"
	"strconv"

	"ansell-backend-api/internal/models"
	"ansell-backend-api/internal/types"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type PropertyHandler struct {
	db *gorm.DB
}

func NewPropertyHandler(db *gorm.DB) *PropertyHandler {
	return &PropertyHandler{db: db}
}

func paginationParams(c *gin.Context) (int, int, int) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "20"))
	if page < 1 {
		page = 1
	}
	if pageSize < 1 || pageSize > 100 {
		pageSize = 20
	}
	return page, pageSize, (page - 1) * pageSize
}

func totalPages(total int64, pageSize int) int {
	tp := int(total) / pageSize
	if int(total)%pageSize != 0 {
		tp++
	}
	return tp
}

// ─────────────────────────────────────
// PUBLIC ROUTES
// ─────────────────────────────────────

// GET /api/properties
func (h *PropertyHandler) ListPublicProperties(c *gin.Context) {
	page, pageSize, offset := paginationParams(c)

	query := h.db.Model(&models.Property{}).
		Where("status = ? AND is_active = true", models.PropertyActive).
		Preload("Owner")

	if cat := c.Query("category"); cat != "" {
		query = query.Where("category = ?", cat)
	}
	if city := c.Query("city"); city != "" {
		query = query.Where("city ILIKE ?", "%"+city+"%")
	}
	if minP := c.Query("min_price"); minP != "" {
		if v, err := strconv.ParseFloat(minP, 64); err == nil {
			query = query.Where("price >= ?", v)
		}
	}
	if maxP := c.Query("max_price"); maxP != "" {
		if v, err := strconv.ParseFloat(maxP, 64); err == nil {
			query = query.Where("price <= ?", v)
		}
	}
	if c.Query("is_featured") == "true" {
		query = query.Where("is_featured = true")
	}
	if search := c.Query("search"); search != "" {
		query = query.Where("title ILIKE ? OR description ILIKE ? OR location ILIKE ?",
			"%"+search+"%", "%"+search+"%", "%"+search+"%")
	}

	var total int64
	query.Count(&total)

	var props []models.Property
	if err := query.Order("is_featured desc, created_at desc").Offset(offset).Limit(pageSize).Find(&props).Error; err != nil {
		c.JSON(http.StatusInternalServerError, types.ErrorResponse{
			Success: false,
			Message: "Failed to fetch properties",
		})
		return
	}

	c.JSON(http.StatusOK, types.PaginatedResponse{
		Success:    true,
		Message:    "Properties fetched",
		Data:       props,
		Page:       page,
		PageSize:   pageSize,
		TotalItems: total,
		TotalPages: totalPages(total, pageSize),
	})
}

// GET /api/properties/:id
func (h *PropertyHandler) GetPublicProperty(c *gin.Context) {
	id := c.Param("id")
	var prop models.Property
	if err := h.db.Preload("Owner").Where("id = ? AND status = ? AND is_active = true", id, models.PropertyActive).First(&prop).Error; err != nil {
		c.JSON(http.StatusNotFound, types.ErrorResponse{
			Success: false,
			Message: "Property not found",
		})
		return
	}

	// Increment views
	h.db.Model(&prop).UpdateColumn("views", gorm.Expr("views + 1"))
	prop.Views++

	c.JSON(http.StatusOK, types.SuccessResponse{
		Success: true,
		Message: "Property fetched",
		Data:    prop,
	})
}

// POST /api/properties/:id/inquire
func (h *PropertyHandler) SubmitInquiry(c *gin.Context) {
	id := c.Param("id")
	var prop models.Property
	if err := h.db.First(&prop, "id = ? AND status = ?", id, models.PropertyActive).Error; err != nil {
		c.JSON(http.StatusNotFound, types.ErrorResponse{
			Success: false,
			Message: "Property not found",
		})
		return
	}

	var req types.SubmitInquiryRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, types.ErrorResponse{
			Success: false,
			Message: "Validation failed",
			Error:   err.Error(),
		})
		return
	}

	propID, _ := uuid.Parse(id)
	inquiry := models.PropertyInquiry{
		PropertyID: propID,
		Name:       req.Name,
		Email:      req.Email,
		Phone:      req.Phone,
		Message:    req.Message,
	}

	// Attach user if authenticated
	if userIDStr, exists := c.Get("user_id"); exists {
		if uid, err := uuid.Parse(userIDStr.(string)); err == nil {
			inquiry.UserID = &uid
		}
	}

	if err := h.db.Create(&inquiry).Error; err != nil {
		c.JSON(http.StatusInternalServerError, types.ErrorResponse{
			Success: false,
			Message: "Failed to submit inquiry",
		})
		return
	}

	c.JSON(http.StatusCreated, types.SuccessResponse{
		Success: true,
		Message: "Inquiry submitted successfully",
		Data:    inquiry,
	})
}

// ─────────────────────────────────────
// OWNER ROUTES
// ─────────────────────────────────────

// GET /api/owner/properties
func (h *PropertyHandler) ListOwnerProperties(c *gin.Context) {
	userIDStr, _ := c.Get("user_id")
	userID, _ := uuid.Parse(userIDStr.(string))

	page, pageSize, offset := paginationParams(c)

	query := h.db.Model(&models.Property{}).Where("owner_id = ?", userID)

	var total int64
	query.Count(&total)

	var props []models.Property
	if err := query.Order("created_at desc").Offset(offset).Limit(pageSize).Find(&props).Error; err != nil {
		c.JSON(http.StatusInternalServerError, types.ErrorResponse{
			Success: false,
			Message: "Failed to fetch properties",
		})
		return
	}

	c.JSON(http.StatusOK, types.PaginatedResponse{
		Success:    true,
		Message:    "Properties fetched",
		Data:       props,
		Page:       page,
		PageSize:   pageSize,
		TotalItems: total,
		TotalPages: totalPages(total, pageSize),
	})
}

// POST /api/owner/properties
func (h *PropertyHandler) CreateOwnerProperty(c *gin.Context) {
	userIDStr, _ := c.Get("user_id")
	userID, _ := uuid.Parse(userIDStr.(string))

	var req types.CreatePropertyRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, types.ErrorResponse{
			Success: false,
			Message: "Validation failed",
			Error:   err.Error(),
		})
		return
	}

	prop := models.Property{
		OwnerID:      userID,
		Title:        req.Title,
		Description:  req.Description,
		Category:     req.Category,
		Price:        req.Price,
		PricePeriod:  req.PricePeriod,
		Currency:     req.Currency,
		City:         req.City,
		Location:     req.Location,
		Address:      req.Address,
		Bedrooms:     req.Bedrooms,
		Bathrooms:    req.Bathrooms,
		SizeM2:       req.SizeM2,
		Amenities:    req.Amenities,
		Images:       req.Images,
		ContactPhone: req.ContactPhone,
		ContactEmail: req.ContactEmail,
		Status:       models.PropertyPendingReview, // owners always submit for review
		IsActive:     true,
	}
	if prop.Currency == "" {
		prop.Currency = "USD"
	}

	if err := h.db.Create(&prop).Error; err != nil {
		c.JSON(http.StatusInternalServerError, types.ErrorResponse{
			Success: false,
			Message: "Failed to create property",
		})
		return
	}

	c.JSON(http.StatusCreated, types.SuccessResponse{
		Success: true,
		Message: "Property submitted for review",
		Data:    prop,
	})
}

// PUT /api/owner/properties/:id
func (h *PropertyHandler) UpdateOwnerProperty(c *gin.Context) {
	userIDStr, _ := c.Get("user_id")
	userID, _ := uuid.Parse(userIDStr.(string))

	id := c.Param("id")
	var prop models.Property
	if err := h.db.Where("id = ? AND owner_id = ?", id, userID).First(&prop).Error; err != nil {
		c.JSON(http.StatusNotFound, types.ErrorResponse{
			Success: false,
			Message: "Property not found or access denied",
		})
		return
	}

	var req types.UpdatePropertyRequest
	c.ShouldBindJSON(&req)

	if req.Title != "" {
		prop.Title = req.Title
	}
	if req.Description != "" {
		prop.Description = req.Description
	}
	if req.Category != "" {
		prop.Category = req.Category
	}
	if req.Price != 0 {
		prop.Price = req.Price
	}
	if req.PricePeriod != "" {
		prop.PricePeriod = req.PricePeriod
	}
	if req.Currency != "" {
		prop.Currency = req.Currency
	}
	if req.City != "" {
		prop.City = req.City
	}
	if req.Location != "" {
		prop.Location = req.Location
	}
	if req.Address != "" {
		prop.Address = req.Address
	}
	if req.Bedrooms != nil {
		prop.Bedrooms = req.Bedrooms
	}
	if req.Bathrooms != nil {
		prop.Bathrooms = req.Bathrooms
	}
	if req.SizeM2 != nil {
		prop.SizeM2 = req.SizeM2
	}
	if req.Amenities != "" {
		prop.Amenities = req.Amenities
	}
	if req.Images != "" {
		prop.Images = req.Images
	}
	if req.ContactPhone != "" {
		prop.ContactPhone = req.ContactPhone
	}
	if req.ContactEmail != "" {
		prop.ContactEmail = req.ContactEmail
	}

	if err := h.db.Save(&prop).Error; err != nil {
		c.JSON(http.StatusInternalServerError, types.ErrorResponse{
			Success: false,
			Message: "Failed to update property",
		})
		return
	}

	c.JSON(http.StatusOK, types.SuccessResponse{
		Success: true,
		Message: "Property updated",
		Data:    prop,
	})
}

// DELETE /api/owner/properties/:id
func (h *PropertyHandler) DeleteOwnerProperty(c *gin.Context) {
	userIDStr, _ := c.Get("user_id")
	userID, _ := uuid.Parse(userIDStr.(string))

	id := c.Param("id")
	if err := h.db.Where("id = ? AND owner_id = ?", id, userID).Delete(&models.Property{}).Error; err != nil {
		c.JSON(http.StatusNotFound, types.ErrorResponse{
			Success: false,
			Message: "Property not found or access denied",
		})
		return
	}

	c.JSON(http.StatusOK, types.SuccessResponse{
		Success: true,
		Message: "Property deleted",
	})
}

// GET /api/owner/inquiries
func (h *PropertyHandler) ListOwnerInquiries(c *gin.Context) {
	userIDStr, _ := c.Get("user_id")
	userID, _ := uuid.Parse(userIDStr.(string))

	page, pageSize, offset := paginationParams(c)

	// Get property IDs owned by this user
	var propertyIDs []uuid.UUID
	h.db.Model(&models.Property{}).Where("owner_id = ?", userID).Pluck("id", &propertyIDs)

	if len(propertyIDs) == 0 {
		c.JSON(http.StatusOK, types.PaginatedResponse{
			Success:    true,
			Message:    "No inquiries",
			Data:       []interface{}{},
			Page:       page,
			PageSize:   pageSize,
			TotalItems: 0,
			TotalPages: 0,
		})
		return
	}

	query := h.db.Model(&models.PropertyInquiry{}).
		Where("property_id IN ?", propertyIDs).
		Preload("Property")

	var total int64
	query.Count(&total)

	var inquiries []models.PropertyInquiry
	if err := query.Order("created_at desc").Offset(offset).Limit(pageSize).Find(&inquiries).Error; err != nil {
		c.JSON(http.StatusInternalServerError, types.ErrorResponse{
			Success: false,
			Message: "Failed to fetch inquiries",
		})
		return
	}

	c.JSON(http.StatusOK, types.PaginatedResponse{
		Success:    true,
		Message:    "Inquiries fetched",
		Data:       inquiries,
		Page:       page,
		PageSize:   pageSize,
		TotalItems: total,
		TotalPages: totalPages(total, pageSize),
	})
}

// PATCH /api/owner/inquiries/:id/read
func (h *PropertyHandler) MarkInquiryRead(c *gin.Context) {
	userIDStr, _ := c.Get("user_id")
	userID, _ := uuid.Parse(userIDStr.(string))

	id := c.Param("id")
	var inquiry models.PropertyInquiry
	if err := h.db.Preload("Property").First(&inquiry, "id = ?", id).Error; err != nil {
		c.JSON(http.StatusNotFound, types.ErrorResponse{
			Success: false,
			Message: "Inquiry not found",
		})
		return
	}

	// Verify ownership
	var prop models.Property
	if err := h.db.Where("id = ? AND owner_id = ?", inquiry.PropertyID, userID).First(&prop).Error; err != nil {
		c.JSON(http.StatusForbidden, types.ErrorResponse{
			Success: false,
			Message: "Access denied",
		})
		return
	}

	h.db.Model(&inquiry).Update("is_read", true)
	inquiry.IsRead = true

	c.JSON(http.StatusOK, types.SuccessResponse{
		Success: true,
		Message: "Marked as read",
		Data:    inquiry,
	})
}

// ─────────────────────────────────────
// ADMIN ROUTES
// ─────────────────────────────────────

// GET /api/admin/properties
func (h *PropertyHandler) AdminListProperties(c *gin.Context) {
	page, pageSize, offset := paginationParams(c)

	query := h.db.Model(&models.Property{}).Preload("Owner")

	if status := c.Query("status"); status != "" {
		query = query.Where("status = ?", status)
	}
	if cat := c.Query("category"); cat != "" {
		query = query.Where("category = ?", cat)
	}
	if city := c.Query("city"); city != "" {
		query = query.Where("city ILIKE ?", "%"+city+"%")
	}
	if ownerID := c.Query("owner_id"); ownerID != "" {
		query = query.Where("owner_id = ?", ownerID)
	}
	if search := c.Query("search"); search != "" {
		query = query.Where("title ILIKE ? OR description ILIKE ?", "%"+search+"%", "%"+search+"%")
	}

	var total int64
	query.Count(&total)

	var props []models.Property
	if err := query.Order("created_at desc").Offset(offset).Limit(pageSize).Find(&props).Error; err != nil {
		c.JSON(http.StatusInternalServerError, types.ErrorResponse{
			Success: false,
			Message: "Failed to fetch properties",
		})
		return
	}

	c.JSON(http.StatusOK, types.PaginatedResponse{
		Success:    true,
		Message:    "Properties fetched",
		Data:       props,
		Page:       page,
		PageSize:   pageSize,
		TotalItems: total,
		TotalPages: totalPages(total, pageSize),
	})
}

// POST /api/admin/properties
func (h *PropertyHandler) AdminCreateProperty(c *gin.Context) {
	var req types.CreatePropertyRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, types.ErrorResponse{
			Success: false,
			Message: "Validation failed",
			Error:   err.Error(),
		})
		return
	}

	// Use owner_id from body or fall back to admin
	ownerIDStr := c.Query("owner_id")
	var ownerID uuid.UUID
	if ownerIDStr != "" {
		ownerID, _ = uuid.Parse(ownerIDStr)
	} else {
		userIDStr, _ := c.Get("user_id")
		ownerID, _ = uuid.Parse(userIDStr.(string))
	}

	status := req.Status
	if status == "" {
		status = models.PropertyActive
	}

	prop := models.Property{
		OwnerID:      ownerID,
		Title:        req.Title,
		Description:  req.Description,
		Category:     req.Category,
		Price:        req.Price,
		PricePeriod:  req.PricePeriod,
		Currency:     req.Currency,
		City:         req.City,
		Location:     req.Location,
		Address:      req.Address,
		Bedrooms:     req.Bedrooms,
		Bathrooms:    req.Bathrooms,
		SizeM2:       req.SizeM2,
		Amenities:    req.Amenities,
		Images:       req.Images,
		IsFeatured:   req.IsFeatured,
		IsActive:     req.IsActive,
		Status:       status,
		ContactPhone: req.ContactPhone,
		ContactEmail: req.ContactEmail,
	}
	if prop.Currency == "" {
		prop.Currency = "USD"
	}

	if err := h.db.Create(&prop).Error; err != nil {
		c.JSON(http.StatusInternalServerError, types.ErrorResponse{
			Success: false,
			Message: "Failed to create property",
		})
		return
	}

	h.db.Preload("Owner").First(&prop, "id = ?", prop.ID)

	c.JSON(http.StatusCreated, types.SuccessResponse{
		Success: true,
		Message: "Property created",
		Data:    prop,
	})
}

// PUT /api/admin/properties/:id
func (h *PropertyHandler) AdminUpdateProperty(c *gin.Context) {
	id := c.Param("id")
	var prop models.Property
	if err := h.db.First(&prop, "id = ?", id).Error; err != nil {
		c.JSON(http.StatusNotFound, types.ErrorResponse{
			Success: false,
			Message: "Property not found",
		})
		return
	}

	var req types.UpdatePropertyRequest
	c.ShouldBindJSON(&req)

	if req.Title != "" {
		prop.Title = req.Title
	}
	if req.Description != "" {
		prop.Description = req.Description
	}
	if req.Category != "" {
		prop.Category = req.Category
	}
	if req.Price != 0 {
		prop.Price = req.Price
	}
	if req.PricePeriod != "" {
		prop.PricePeriod = req.PricePeriod
	}
	if req.Currency != "" {
		prop.Currency = req.Currency
	}
	if req.City != "" {
		prop.City = req.City
	}
	if req.Location != "" {
		prop.Location = req.Location
	}
	if req.Address != "" {
		prop.Address = req.Address
	}
	if req.Bedrooms != nil {
		prop.Bedrooms = req.Bedrooms
	}
	if req.Bathrooms != nil {
		prop.Bathrooms = req.Bathrooms
	}
	if req.SizeM2 != nil {
		prop.SizeM2 = req.SizeM2
	}
	if req.Amenities != "" {
		prop.Amenities = req.Amenities
	}
	if req.Images != "" {
		prop.Images = req.Images
	}
	if req.IsFeatured != nil {
		prop.IsFeatured = *req.IsFeatured
	}
	if req.IsActive != nil {
		prop.IsActive = *req.IsActive
	}
	if req.Status != "" {
		prop.Status = req.Status
	}
	if req.ContactPhone != "" {
		prop.ContactPhone = req.ContactPhone
	}
	if req.ContactEmail != "" {
		prop.ContactEmail = req.ContactEmail
	}
	if req.ReviewNote != "" {
		prop.ReviewNote = req.ReviewNote
	}

	if err := h.db.Save(&prop).Error; err != nil {
		c.JSON(http.StatusInternalServerError, types.ErrorResponse{
			Success: false,
			Message: "Failed to update property",
		})
		return
	}

	h.db.Preload("Owner").First(&prop, "id = ?", prop.ID)

	c.JSON(http.StatusOK, types.SuccessResponse{
		Success: true,
		Message: "Property updated",
		Data:    prop,
	})
}

// DELETE /api/admin/properties/:id
func (h *PropertyHandler) AdminDeleteProperty(c *gin.Context) {
	id := c.Param("id")
	if err := h.db.Delete(&models.Property{}, "id = ?", id).Error; err != nil {
		c.JSON(http.StatusNotFound, types.ErrorResponse{
			Success: false,
			Message: "Property not found",
		})
		return
	}

	c.JSON(http.StatusOK, types.SuccessResponse{
		Success: true,
		Message: "Property deleted",
	})
}

// PATCH /api/admin/properties/:id/approve
func (h *PropertyHandler) AdminApproveProperty(c *gin.Context) {
	id := c.Param("id")
	if err := h.db.Model(&models.Property{}).Where("id = ?", id).Update("status", models.PropertyActive).Error; err != nil {
		c.JSON(http.StatusInternalServerError, types.ErrorResponse{
			Success: false,
			Message: "Failed to approve property",
		})
		return
	}

	var prop models.Property
	h.db.Preload("Owner").First(&prop, "id = ?", id)

	c.JSON(http.StatusOK, types.SuccessResponse{
		Success: true,
		Message: "Property approved and set to active",
		Data:    prop,
	})
}

// PATCH /api/admin/properties/:id/reject
func (h *PropertyHandler) AdminRejectProperty(c *gin.Context) {
	id := c.Param("id")
	var req types.UpdatePropertyRequest
	c.ShouldBindJSON(&req)

	updates := map[string]interface{}{
		"status": models.PropertyRejected,
	}
	if req.ReviewNote != "" {
		updates["review_note"] = req.ReviewNote
	}

	if err := h.db.Model(&models.Property{}).Where("id = ?", id).Updates(updates).Error; err != nil {
		c.JSON(http.StatusInternalServerError, types.ErrorResponse{
			Success: false,
			Message: "Failed to reject property",
		})
		return
	}

	var prop models.Property
	h.db.Preload("Owner").First(&prop, "id = ?", id)

	c.JSON(http.StatusOK, types.SuccessResponse{
		Success: true,
		Message: "Property rejected",
		Data:    prop,
	})
}

// PATCH /api/admin/properties/:id/feature
func (h *PropertyHandler) AdminFeatureProperty(c *gin.Context) {
	id := c.Param("id")
	var prop models.Property
	if err := h.db.First(&prop, "id = ?", id).Error; err != nil {
		c.JSON(http.StatusNotFound, types.ErrorResponse{
			Success: false,
			Message: "Property not found",
		})
		return
	}

	newFeatured := !prop.IsFeatured
	h.db.Model(&prop).Update("is_featured", newFeatured)
	prop.IsFeatured = newFeatured

	msg := "Property featured"
	if !newFeatured {
		msg = "Property unfeatured"
	}

	c.JSON(http.StatusOK, types.SuccessResponse{
		Success: true,
		Message: msg,
		Data:    prop,
	})
}
