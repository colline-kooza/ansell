package handlers

import (
	"ansell-backend-api/internal/models"
	"ansell-backend-api/internal/types"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type CourseHandler struct {
	db *gorm.DB
}

func NewCourseHandler(db *gorm.DB) *CourseHandler {
	return &CourseHandler{db: db}
}

// GET /api/courses & GET /api/admin/courses
func (h *CourseHandler) List(c *gin.Context) {
	var courses []models.Course
	query := h.db.Model(&models.Course{})

	isAdmin := strings.HasPrefix(c.Request.URL.Path, "/api/admin")
	if !isAdmin {
		query = query.Where("is_active = ?", true).Where("status = ?", models.CourseStatusActive)
	} else {
		if isActive := c.Query("is_active"); isActive != "" {
			query = query.Where("is_active = ?", isActive == "true")
		}
		if status := c.Query("status"); status != "" {
			query = query.Where("status = ?", status)
		}
	}

	if category := c.Query("category"); category != "" {
		query = query.Where("category = ?", category)
	}
	if isFeatured := c.Query("is_featured"); isFeatured != "" {
		query = query.Where("is_featured = ?", isFeatured == "true")
	}
	if isFree := c.Query("is_free"); isFree != "" {
		query = query.Where("is_free = ?", isFree == "true")
	}
	if mode := c.Query("mode"); mode != "" {
		query = query.Where("mode = ?", mode)
	}
	if search := c.Query("search"); search != "" {
		searchTerm := "%" + search + "%"
		query = query.Where("title ILIKE ? OR provider ILIKE ? OR description ILIKE ?", searchTerm, searchTerm, searchTerm)
	}

	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	if page < 1 {
		page = 1
	}
	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "12"))
	if pageSize < 1 || pageSize > 100 {
		pageSize = 12
	}
	offset := (page - 1) * pageSize

	var total int64
	query.Count(&total)

	query = query.Order("is_featured DESC, created_at DESC")

	if err := query.Offset(offset).Limit(pageSize).Preload("CreatedBy").Find(&courses).Error; err != nil {
		c.JSON(http.StatusInternalServerError, types.ErrorResponse{
			Success: false,
			Message: "Failed to fetch courses",
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
		Data:       courses,
		Page:       page,
		PageSize:   pageSize,
		TotalItems: total,
		TotalPages: totalPages,
	})
}

// GET /api/courses/:id & GET /api/admin/courses/:id
func (h *CourseHandler) Get(c *gin.Context) {
	id := c.Param("id")
	var course models.Course

	if err := h.db.Preload("CreatedBy").First(&course, id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, types.ErrorResponse{
				Success: false,
				Message: "Course not found",
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
		h.db.Model(&course).UpdateColumn("views", gorm.Expr("views + ?", 1))
		course.Views++
	}

	c.JSON(http.StatusOK, types.SuccessResponse{
		Success: true,
		Data:    course,
	})
}

// GET /api/courses/categories
func (h *CourseHandler) GetCategories(c *gin.Context) {
	var results []struct {
		Category string `json:"category"`
		Count    int    `json:"count"`
	}

	if err := h.db.Model(&models.Course{}).
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

	labels := map[string]string{
		string(models.CourseCategoryUniversityCollege):          "University/College Programs",
		string(models.CourseCategoryScholarships):               "Scholarships",
		string(models.CourseCategoryTelecomICT):                 "Telecom & ICT",
		string(models.CourseCategoryBankingFinance):             "Banking & Finance",
		string(models.CourseCategoryAgricultureAgribusiness):    "Agriculture & Agribusiness",
		string(models.CourseCategoryConstructionInfrastructure): "Construction & Infrastructure",
		string(models.CourseCategoryHealthcareMedical):          "Healthcare & Medical",
		string(models.CourseCategoryVocationalSkills):           "Vocational Skills",
	}

	type CatResponse struct {
		Category string `json:"category"`
		Label    string `json:"label"`
		Count    int    `json:"count"`
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

// CreateCourseRequest — used for both create and update
type CreateCourseRequest struct {
	Title        string   `json:"title" binding:"required"`
	Description  string   `json:"description"`
	Notes        string   `json:"notes"`
	Provider     string   `json:"provider" binding:"required"`
	Category     string   `json:"category" binding:"required"`
	Price        *float64 `json:"price"`
	Currency     string   `json:"currency"`
	IsFree       *bool    `json:"is_free"`
	VideoURL     string   `json:"video_url"`
	ThumbnailURL string   `json:"thumbnail_url"`
	Duration      string   `json:"duration"`
	Level         string   `json:"level"`
	Mode          string   `json:"mode"`
	Location     string   `json:"location"`
	City         string   `json:"city"`
	StartDate    string   `json:"start_date"`
	EndDate      string   `json:"end_date"`
	Schedule     string   `json:"schedule"`
	Capacity     *int     `json:"capacity"`
	Status       string   `json:"status"`
	IsActive     *bool    `json:"is_active"`
	IsFeatured   *bool    `json:"is_featured"`
	Curriculum   string   `json:"curriculum"`
	Requirements string   `json:"requirements"`
	Tags         string   `json:"tags"`
	ContactEmail string   `json:"contact_email"`
	ContactPhone string   `json:"contact_phone"`
}

// POST /api/admin/courses
func (h *CourseHandler) Create(c *gin.Context) {
	var req CreateCourseRequest
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

	course := models.Course{
		CreatedByID:  userID,
		Title:        req.Title,
		Description:  req.Description,
		Notes:        req.Notes,
		Provider:     req.Provider,
		Category:     models.CourseCategory(req.Category),
		VideoURL:     req.VideoURL,
		ThumbnailURL: req.ThumbnailURL,
		Duration:     req.Duration,
		Level:        req.Level,
		Location:     req.Location,
		City:         req.City,
		Schedule:     req.Schedule,
		Capacity:     req.Capacity,
		Curriculum:   req.Curriculum,
		Requirements: req.Requirements,
		Tags:         req.Tags,
		ContactEmail: req.ContactEmail,
		ContactPhone: req.ContactPhone,
	}

	if req.Mode != "" {
		course.Mode = models.CourseMode(req.Mode)
	} else {
		course.Mode = models.CourseModeInPerson
	}

	if len(req.Currency) > 10 {
		course.Currency = req.Currency[:10]
	} else if req.Currency != "" {
		course.Currency = req.Currency
	} else {
		course.Currency = "USD"
	}

	if req.Price != nil {
		course.Price = *req.Price
	}

	if req.IsFree != nil {
		course.IsFree = *req.IsFree
		if course.IsFree {
			course.Price = 0
		}
	}

	if req.Status != "" {
		course.Status = models.CourseStatus(req.Status)
	} else {
		course.Status = models.CourseStatusDraft
	}

	if req.IsActive != nil {
		course.IsActive = *req.IsActive
	} else {
		course.IsActive = true
	}

	if req.IsFeatured != nil {
		course.IsFeatured = *req.IsFeatured
	}

	if req.StartDate != "" {
		if t, err := time.Parse("2006-01-02", req.StartDate); err == nil {
			course.StartDate = &t
		}
	}
	if req.EndDate != "" {
		if t, err := time.Parse("2006-01-02", req.EndDate); err == nil {
			course.EndDate = &t
		}
	}

	if err := h.db.Create(&course).Error; err != nil {
		c.JSON(http.StatusInternalServerError, types.ErrorResponse{
			Success: false,
			Message: "Failed to create course",
			Error:   err.Error(),
		})
		return
	}

	h.db.Preload("CreatedBy").First(&course, course.ID)

	c.JSON(http.StatusCreated, types.SuccessResponse{
		Success: true,
		Data:    course,
	})
}

// PUT /api/admin/courses/:id
func (h *CourseHandler) Update(c *gin.Context) {
	id := c.Param("id")
	var course models.Course

	if err := h.db.First(&course, id).Error; err != nil {
		c.JSON(http.StatusNotFound, types.ErrorResponse{Success: false, Message: "Course not found"})
		return
	}

	var req CreateCourseRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, types.ErrorResponse{Success: false, Message: "Validation failed", Error: err.Error()})
		return
	}

	course.Title = req.Title
	course.Description = req.Description
	course.Notes = req.Notes
	course.Provider = req.Provider
	course.Category = models.CourseCategory(req.Category)
	course.VideoURL = req.VideoURL
	course.ThumbnailURL = req.ThumbnailURL
	course.Duration = req.Duration
	course.Level = req.Level
	course.Location = req.Location
	course.City = req.City
	course.Schedule = req.Schedule
	course.Capacity = req.Capacity
	course.Curriculum = req.Curriculum
	course.Requirements = req.Requirements
	course.Tags = req.Tags
	course.ContactEmail = req.ContactEmail
	course.ContactPhone = req.ContactPhone

	if req.Mode != "" {
		course.Mode = models.CourseMode(req.Mode)
	}
	if len(req.Currency) > 10 {
		course.Currency = req.Currency[:10]
	} else if req.Currency != "" {
		course.Currency = req.Currency
	}
	if req.Price != nil {
		course.Price = *req.Price
	}
	if req.IsFree != nil {
		course.IsFree = *req.IsFree
		if course.IsFree {
			course.Price = 0
		}
	}
	if req.Status != "" {
		course.Status = models.CourseStatus(req.Status)
	}
	if req.IsActive != nil {
		course.IsActive = *req.IsActive
	}
	if req.IsFeatured != nil {
		course.IsFeatured = *req.IsFeatured
	}
	if req.StartDate != "" {
		if t, err := time.Parse("2006-01-02", req.StartDate); err == nil {
			course.StartDate = &t
		}
	} else {
		course.StartDate = nil
	}
	if req.EndDate != "" {
		if t, err := time.Parse("2006-01-02", req.EndDate); err == nil {
			course.EndDate = &t
		}
	} else {
		course.EndDate = nil
	}

	if err := h.db.Save(&course).Error; err != nil {
		c.JSON(http.StatusInternalServerError, types.ErrorResponse{Success: false, Message: "Failed to update course", Error: err.Error()})
		return
	}

	h.db.Preload("CreatedBy").First(&course, course.ID)

	c.JSON(http.StatusOK, types.SuccessResponse{
		Success: true,
		Data:    course,
	})
}

// DELETE /api/admin/courses/:id
func (h *CourseHandler) Delete(c *gin.Context) {
	id := c.Param("id")
	if err := h.db.Delete(&models.Course{}, id).Error; err != nil {
		c.JSON(http.StatusInternalServerError, types.ErrorResponse{Success: false, Message: "Failed to delete course"})
		return
	}
	c.JSON(http.StatusOK, types.SuccessResponse{Success: true, Message: "Course deleted"})
}

// PATCH /api/admin/courses/:id/feature
func (h *CourseHandler) ToggleFeature(c *gin.Context) {
	id := c.Param("id")
	var course models.Course

	if err := h.db.First(&course, id).Error; err != nil {
		c.JSON(http.StatusNotFound, types.ErrorResponse{Success: false, Message: "Course not found"})
		return
	}

	course.IsFeatured = !course.IsFeatured
	if err := h.db.Save(&course).Error; err != nil {
		c.JSON(http.StatusInternalServerError, types.ErrorResponse{Success: false, Message: "Failed to toggle feature"})
		return
	}

	h.db.Preload("CreatedBy").First(&course, course.ID)
	c.JSON(http.StatusOK, types.SuccessResponse{Success: true, Data: course})
}

// PATCH /api/admin/courses/:id/toggle-active
func (h *CourseHandler) ToggleActive(c *gin.Context) {
	id := c.Param("id")
	var course models.Course

	if err := h.db.First(&course, id).Error; err != nil {
		c.JSON(http.StatusNotFound, types.ErrorResponse{Success: false, Message: "Course not found"})
		return
	}

	course.IsActive = !course.IsActive
	if err := h.db.Save(&course).Error; err != nil {
		c.JSON(http.StatusInternalServerError, types.ErrorResponse{Success: false, Message: "Failed to toggle active"})
		return
	}

	h.db.Preload("CreatedBy").First(&course, course.ID)
	c.JSON(http.StatusOK, types.SuccessResponse{Success: true, Data: course})
}

// PATCH /api/admin/courses/:id/publish
func (h *CourseHandler) Publish(c *gin.Context) {
	id := c.Param("id")
	var course models.Course

	if err := h.db.First(&course, id).Error; err != nil {
		c.JSON(http.StatusNotFound, types.ErrorResponse{Success: false, Message: "Course not found"})
		return
	}

	course.Status = models.CourseStatusActive
	course.IsActive = true
	if err := h.db.Save(&course).Error; err != nil {
		c.JSON(http.StatusInternalServerError, types.ErrorResponse{Success: false, Message: "Failed to publish course"})
		return
	}

	h.db.Preload("CreatedBy").First(&course, course.ID)
	c.JSON(http.StatusOK, types.SuccessResponse{Success: true, Message: "Course published", Data: course})
}

// PATCH /api/admin/courses/:id/unpublish
func (h *CourseHandler) Unpublish(c *gin.Context) {
	id := c.Param("id")
	var course models.Course

	if err := h.db.First(&course, id).Error; err != nil {
		c.JSON(http.StatusNotFound, types.ErrorResponse{Success: false, Message: "Course not found"})
		return
	}

	course.Status = models.CourseStatusDraft
	course.IsActive = false
	if err := h.db.Save(&course).Error; err != nil {
		c.JSON(http.StatusInternalServerError, types.ErrorResponse{Success: false, Message: "Failed to unpublish course"})
		return
	}

	h.db.Preload("CreatedBy").First(&course, course.ID)
	c.JSON(http.StatusOK, types.SuccessResponse{Success: true, Message: "Course unpublished", Data: course})
}
