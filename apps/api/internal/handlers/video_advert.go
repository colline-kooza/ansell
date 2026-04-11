package handlers

import (
	"ansell-backend-api/internal/models"
	"ansell-backend-api/internal/types"
	"net/http"
	"strconv"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type VideoAdvertHandler struct {
	db *gorm.DB
}

func NewVideoAdvertHandler(db *gorm.DB) *VideoAdvertHandler {
	return &VideoAdvertHandler{db: db}
}

// GET /api/video-adverts & GET /api/admin/video-adverts
func (h *VideoAdvertHandler) List(c *gin.Context) {
	var adverts []models.VideoAdvert
	query := h.db.Model(&models.VideoAdvert{})

	// Public vs Admin context
	isAdmin := strings.HasPrefix(c.Request.URL.Path, "/api/admin")
	if !isAdmin {
		query = query.Where("is_active = ?", true)
	} else {
		if isActive := c.Query("is_active"); isActive != "" {
			query = query.Where("is_active = ?", isActive == "true")
		}
	}

	if category := c.Query("category"); category != "" {
		query = query.Where("category = ?", category)
	}
	if isFeatured := c.Query("is_featured"); isFeatured != "" {
		query = query.Where("is_featured = ?", isFeatured == "true")
	}
	if search := c.Query("search"); search != "" {
		searchTerm := "%" + search + "%"
		query = query.Where("title ILIKE ? OR sponsor ILIKE ?", searchTerm, searchTerm)
	}

	// Pagination
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	if page < 1 {
		page = 1
	}
	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "10"))
	if pageSize < 1 || pageSize > 100 {
		pageSize = 10
	}
	offset := (page - 1) * pageSize

	var total int64
	query.Count(&total)

	// Admin view generally sorts by created descending
	// Public expects is_featured DESC, created_at DESC
	query = query.Order("is_featured DESC, created_at DESC")

	if err := query.Offset(offset).Limit(pageSize).Preload("CreatedBy").Find(&adverts).Error; err != nil {
		c.JSON(http.StatusInternalServerError, types.ErrorResponse{
			Success: false,
			Message: "Failed to fetch video adverts",
			Error:   err.Error(),
		})
		return
	}

	totalPages := int(total) / pageSize
	if int(total)%pageSize > 0 {
		totalPages++
	}

	c.JSON(http.StatusOK, types.PaginatedResponse{
		Success:    true,
		Message:    "Success",
		Data:       adverts,
		Page:       page,
		PageSize:   pageSize,
		TotalItems: total,
		TotalPages: totalPages,
	})
}

// GET /api/video-adverts/:id & GET /api/admin/video-adverts/:id
func (h *VideoAdvertHandler) Get(c *gin.Context) {
	id := c.Param("id")
	var advert models.VideoAdvert

	if err := h.db.Preload("CreatedBy").First(&advert, id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, types.ErrorResponse{
				Success: false,
				Message: "Video advert not found",
			})
		} else {
			c.JSON(http.StatusInternalServerError, types.ErrorResponse{
				Success: false,
				Message: "Database error",
				Error:   err.Error(),
			})
		}
		return
	}

	isAdmin := strings.HasPrefix(c.Request.URL.Path, "/api/admin")
	if !isAdmin {
		// Increment views for public view
		h.db.Model(&advert).UpdateColumn("views", gorm.Expr("views + ?", 1))
		advert.Views++
	}

	c.JSON(http.StatusOK, types.SuccessResponse{
		Success: true,
		Data:    advert,
	})
}

// GET /api/video-adverts/categories
func (h *VideoAdvertHandler) GetCategories(c *gin.Context) {
	var results []struct {
		Category string `json:"category"`
		Count    int    `json:"count"`
	}

	if err := h.db.Model(&models.VideoAdvert{}).
		Select("category, count(*) as count").
		Where("is_active = ?", true).
		Group("category").
		Scan(&results).Error; err != nil {
		c.JSON(http.StatusInternalServerError, types.ErrorResponse{
			Success: false,
			Message: "Failed to fetch categories",
			Error:   err.Error(),
		})
		return
	}

	// Map generic labels for frontend (optional, frontend usually matches keys anyway)
	type CatResponse struct {
		Category string `json:"category"`
		Label    string `json:"label"`
		Count    int    `json:"count"`
	}

	labels := map[string]string{
		string(models.CategoryRealEstatePromos):  "Real Estate Promos",
		string(models.CategoryCorporateCampaigns): "Corporate Campaigns",
		string(models.CategoryProductLaunches):   "Product Launches",
		string(models.CategoryServiceSpotlights): "Service Spotlights",
		string(models.CategorySponsoredContent):  "Sponsored Content",
	}

	var responseData []CatResponse
	for _, r := range results {
		lbl := labels[r.Category]
		if lbl == "" {
			lbl = r.Category
		}
		responseData = append(responseData, CatResponse{
			Category: r.Category,
			Label:    lbl,
			Count:    r.Count,
		})
	}

	c.JSON(http.StatusOK, types.SuccessResponse{
		Success: true,
		Data:    responseData,
	})
}

// CreateRequest
type CreateVideoAdvertRequest struct {
	Title        string `json:"title" binding:"required"`
	Description  string `json:"description"`
	Sponsor      string `json:"sponsor"`
	Category     string `json:"category" binding:"required"`
	VideoURL     string `json:"video_url" binding:"required"`
	ThumbnailURL string `json:"thumbnail_url" binding:"required"`
	Duration     *int   `json:"duration"`
	IsActive     *bool  `json:"is_active"`
	IsFeatured   *bool  `json:"is_featured"`
}

// POST /api/admin/video-adverts
func (h *VideoAdvertHandler) Create(c *gin.Context) {
	var req CreateVideoAdvertRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, types.ErrorResponse{
			Success: false,
			Message: "Validation failed",
			Error:   err.Error(),
		})
		return
	}

	userIDInterface, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, types.ErrorResponse{Success: false, Message: "Unauthorized"})
		return
	}
	userIDStr, ok := userIDInterface.(string)
	if !ok {
		c.JSON(http.StatusUnauthorized, types.ErrorResponse{Success: false, Message: "Invalid user auth"})
		return
	}
	
	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		c.JSON(http.StatusUnauthorized, types.ErrorResponse{Success: false, Message: "Invalid user ID format"})
		return
	}

	advert := models.VideoAdvert{
		CreatedByID:  userID,
		Title:        req.Title,
		Description:  req.Description,
		Sponsor:      req.Sponsor,
		Category:     models.VideoAdvertCategory(req.Category),
		VideoURL:     req.VideoURL,
		ThumbnailURL: req.ThumbnailURL,
		Duration:     req.Duration,
	}

	if req.IsActive != nil {
		advert.IsActive = *req.IsActive
	} else {
		advert.IsActive = true
	}

	if req.IsFeatured != nil {
		advert.IsFeatured = *req.IsFeatured
	} else {
		advert.IsFeatured = false
	}

	if err := h.db.Create(&advert).Error; err != nil {
		c.JSON(http.StatusInternalServerError, types.ErrorResponse{
			Success: false,
			Message: "Failed to create video advert",
			Error:   err.Error(),
		})
		return
	}

	h.db.Preload("CreatedBy").First(&advert, advert.ID)

	c.JSON(http.StatusCreated, types.SuccessResponse{
		Success: true,
		Data:    advert,
	})
}

// PUT /api/admin/video-adverts/:id
func (h *VideoAdvertHandler) Update(c *gin.Context) {
	id := c.Param("id")
	var advert models.VideoAdvert

	if err := h.db.First(&advert, id).Error; err != nil {
		c.JSON(http.StatusNotFound, types.ErrorResponse{Success: false, Message: "Not found"})
		return
	}

	var req CreateVideoAdvertRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, types.ErrorResponse{Success: false, Message: "Validation failed", Error: err.Error()})
		return
	}

	advert.Title = req.Title
	advert.Description = req.Description
	advert.Sponsor = req.Sponsor
	advert.Category = models.VideoAdvertCategory(req.Category)
	advert.VideoURL = req.VideoURL
	advert.ThumbnailURL = req.ThumbnailURL
	advert.Duration = req.Duration

	if req.IsActive != nil {
		advert.IsActive = *req.IsActive
	}
	if req.IsFeatured != nil {
		advert.IsFeatured = *req.IsFeatured
	}

	if err := h.db.Save(&advert).Error; err != nil {
		c.JSON(http.StatusInternalServerError, types.ErrorResponse{Success: false, Message: "Failed to update", Error: err.Error()})
		return
	}

	h.db.Preload("CreatedBy").First(&advert, advert.ID)

	c.JSON(http.StatusOK, types.SuccessResponse{
		Success: true,
		Data:    advert,
	})
}

// DELETE /api/admin/video-adverts/:id
func (h *VideoAdvertHandler) Delete(c *gin.Context) {
	id := c.Param("id")
	if err := h.db.Delete(&models.VideoAdvert{}, id).Error; err != nil {
		c.JSON(http.StatusInternalServerError, types.ErrorResponse{Success: false, Message: "Failed to delete"})
		return
	}
	c.JSON(http.StatusOK, types.SuccessResponse{Success: true, Message: "Video advert deleted"})
}

// PATCH /api/admin/video-adverts/:id/feature
func (h *VideoAdvertHandler) ToggleFeature(c *gin.Context) {
	id := c.Param("id")
	var advert models.VideoAdvert

	if err := h.db.First(&advert, id).Error; err != nil {
		c.JSON(http.StatusNotFound, types.ErrorResponse{Success: false, Message: "Not found"})
		return
	}

	advert.IsFeatured = !advert.IsFeatured
	if err := h.db.Save(&advert).Error; err != nil {
		c.JSON(http.StatusInternalServerError, types.ErrorResponse{Success: false, Message: "Failed to toggle feature"})
		return
	}

	h.db.Preload("CreatedBy").First(&advert, advert.ID)
	c.JSON(http.StatusOK, types.SuccessResponse{Success: true, Data: advert})
}

// PATCH /api/admin/video-adverts/:id/toggle-active
func (h *VideoAdvertHandler) ToggleActive(c *gin.Context) {
	id := c.Param("id")
	var advert models.VideoAdvert

	if err := h.db.First(&advert, id).Error; err != nil {
		c.JSON(http.StatusNotFound, types.ErrorResponse{Success: false, Message: "Not found"})
		return
	}

	advert.IsActive = !advert.IsActive
	if err := h.db.Save(&advert).Error; err != nil {
		c.JSON(http.StatusInternalServerError, types.ErrorResponse{Success: false, Message: "Failed to toggle active"})
		return
	}

	h.db.Preload("CreatedBy").First(&advert, advert.ID)
	c.JSON(http.StatusOK, types.SuccessResponse{Success: true, Data: advert})
}
