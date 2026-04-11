package handlers

import (
	"ansell-backend-api/internal/models"
	"ansell-backend-api/internal/types"
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type EnrollmentHandler struct {
	db *gorm.DB
}

func NewEnrollmentHandler(db *gorm.DB) *EnrollmentHandler {
	return &EnrollmentHandler{db: db}
}

// ─── Admin Routes ─────────────────────────────────────────────────────────────

// GET /api/admin/enrollments
func (h *EnrollmentHandler) AdminList(c *gin.Context) {
	var enrollments []models.Enrollment
	query := h.db.Model(&models.Enrollment{})

	if search := c.Query("search"); search != "" {
		searchTerm := "%" + search + "%"
		query = query.Joins("JOIN users ON users.id = enrollments.user_id").
			Joins("JOIN courses ON courses.id = enrollments.course_id").
			Where("users.first_name ILIKE ? OR users.last_name ILIKE ? OR users.email ILIKE ? OR courses.title ILIKE ?",
				searchTerm, searchTerm, searchTerm, searchTerm)
	}

	if status := c.Query("payment_status"); status != "" {
		query = query.Where("enrollments.payment_status = ?", status)
	}

	if courseID := c.Query("course_id"); courseID != "" {
		query = query.Where("enrollments.course_id = ?", courseID)
	}

	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	if page < 1 {
		page = 1
	}
	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "20"))
	if pageSize < 1 || pageSize > 100 {
		pageSize = 20
	}
	offset := (page - 1) * pageSize

	var total int64
	query.Count(&total)

	query = query.Order("enrollments.created_at DESC")

	if err := query.Offset(offset).Limit(pageSize).
		Preload("User").
		Preload("Course").
		Find(&enrollments).Error; err != nil {
		c.JSON(http.StatusInternalServerError, types.ErrorResponse{
			Success: false,
			Message: "Failed to fetch enrollments",
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
		Data:       enrollments,
		Page:       page,
		PageSize:   pageSize,
		TotalItems: total,
		TotalPages: totalPages,
	})
}

// GET /api/admin/enrollments/stats
func (h *EnrollmentHandler) AdminStats(c *gin.Context) {
	var stats struct {
		Total   int64   `json:"total"`
		Free    int64   `json:"free"`
		Pending int64   `json:"pending"`
		Paid    int64   `json:"paid"`
		Revenue float64 `json:"revenue"`
	}

	h.db.Model(&models.Enrollment{}).Count(&stats.Total)
	h.db.Model(&models.Enrollment{}).Where("payment_status = ?", models.EnrollmentStatusFree).Count(&stats.Free)
	h.db.Model(&models.Enrollment{}).Where("payment_status = ?", models.EnrollmentStatusPending).Count(&stats.Pending)
	h.db.Model(&models.Enrollment{}).Where("payment_status = ?", models.EnrollmentStatusPaid).Count(&stats.Paid)

	var revenueResult struct {
		Total float64
	}
	h.db.Model(&models.Enrollment{}).
		Select("COALESCE(SUM(amount_paid), 0) as total").
		Where("payment_status = ?", models.EnrollmentStatusPaid).
		Scan(&revenueResult)
	stats.Revenue = revenueResult.Total

	c.JSON(http.StatusOK, types.SuccessResponse{
		Success: true,
		Data:    stats,
	})
}

// UpdateEnrollmentStatusRequest
type UpdateEnrollmentStatusRequest struct {
	PaymentStatus string   `json:"payment_status" binding:"required"`
	AmountPaid    *float64 `json:"amount_paid"`
	TransactionRef string  `json:"transaction_ref"`
}

// PATCH /api/admin/enrollments/:id/status
func (h *EnrollmentHandler) AdminUpdateStatus(c *gin.Context) {
	id := c.Param("id")
	var enrollment models.Enrollment

	if err := h.db.First(&enrollment, id).Error; err != nil {
		c.JSON(http.StatusNotFound, types.ErrorResponse{Success: false, Message: "Enrollment not found"})
		return
	}

	var req UpdateEnrollmentStatusRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, types.ErrorResponse{Success: false, Message: "Validation failed", Error: err.Error()})
		return
	}

	enrollment.PaymentStatus = models.EnrollmentPaymentStatus(req.PaymentStatus)
	if req.AmountPaid != nil {
		enrollment.AmountPaid = req.AmountPaid
	}
	if req.TransactionRef != "" {
		enrollment.TransactionRef = req.TransactionRef
	}

	// Auto-set enrolled_at when confirmed
	if req.PaymentStatus == string(models.EnrollmentStatusPaid) || req.PaymentStatus == string(models.EnrollmentStatusFree) {
		if enrollment.EnrolledAt == nil {
			now := time.Now()
			enrollment.EnrolledAt = &now
		}
	}

	if err := h.db.Save(&enrollment).Error; err != nil {
		c.JSON(http.StatusInternalServerError, types.ErrorResponse{Success: false, Message: "Failed to update enrollment", Error: err.Error()})
		return
	}

	h.db.Preload("User").Preload("Course").First(&enrollment, enrollment.ID)

	c.JSON(http.StatusOK, types.SuccessResponse{
		Success: true,
		Data:    enrollment,
	})
}

// DELETE /api/admin/enrollments/:id
func (h *EnrollmentHandler) AdminDelete(c *gin.Context) {
	id := c.Param("id")
	var enrollment models.Enrollment

	if err := h.db.First(&enrollment, id).Error; err != nil {
		c.JSON(http.StatusNotFound, types.ErrorResponse{Success: false, Message: "Enrollment not found"})
		return
	}

	// Decrement enrolled count on the course
	h.db.Model(&models.Course{}).Where("id = ?", enrollment.CourseID).
		UpdateColumn("enrolled", gorm.Expr("GREATEST(enrolled - ?, 0)", 1))

	if err := h.db.Delete(&enrollment).Error; err != nil {
		c.JSON(http.StatusInternalServerError, types.ErrorResponse{Success: false, Message: "Failed to delete enrollment"})
		return
	}

	c.JSON(http.StatusOK, types.SuccessResponse{Success: true, Message: "Enrollment removed"})
}

// ─── User Routes ──────────────────────────────────────────────────────────────

// GET /api/enrollments/my
func (h *EnrollmentHandler) MyEnrollments(c *gin.Context) {
	userIDInterface, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, types.ErrorResponse{Success: false, Message: "Unauthorized"})
		return
	}
	userIDStr := userIDInterface.(string)
	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		c.JSON(http.StatusUnauthorized, types.ErrorResponse{Success: false, Message: "Invalid user ID"})
		return
	}

	var enrollments []models.Enrollment
	if err := h.db.Where("user_id = ?", userID).
		Order("created_at DESC").
		Preload("Course").
		Find(&enrollments).Error; err != nil {
		c.JSON(http.StatusInternalServerError, types.ErrorResponse{
			Success: false,
			Message: "Failed to fetch enrollments",
			Error:   err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, types.SuccessResponse{
		Success: true,
		Data:    enrollments,
	})
}

// GET /api/enrollments/check/:course_id
func (h *EnrollmentHandler) CheckEnrolled(c *gin.Context) {
	courseID := c.Param("course_id")

	userIDInterface, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, types.ErrorResponse{Success: false, Message: "Unauthorized"})
		return
	}
	userIDStr := userIDInterface.(string)
	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		c.JSON(http.StatusUnauthorized, types.ErrorResponse{Success: false, Message: "Invalid user ID"})
		return
	}

	var enrollment models.Enrollment
	result := h.db.Where("user_id = ? AND course_id = ?", userID, courseID).First(&enrollment)

	if result.Error != nil {
		if result.Error == gorm.ErrRecordNotFound {
			c.JSON(http.StatusOK, types.SuccessResponse{
				Success: true,
				Data: gin.H{
					"enrolled":       false,
					"payment_status": nil,
				},
			})
			return
		}
		c.JSON(http.StatusInternalServerError, types.ErrorResponse{Success: false, Message: "Database error"})
		return
	}

	c.JSON(http.StatusOK, types.SuccessResponse{
		Success: true,
		Data: gin.H{
			"enrolled":        true,
			"enrollment_id":   enrollment.ID,
			"payment_status":  enrollment.PaymentStatus,
			"amount_paid":     enrollment.AmountPaid,
			"enrolled_at":     enrollment.EnrolledAt,
		},
	})
}

// EnrollRequest
type EnrollRequest struct {
	CourseID uint `json:"course_id" binding:"required"`
}

// POST /api/enrollments
func (h *EnrollmentHandler) Enroll(c *gin.Context) {
	userIDInterface, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, types.ErrorResponse{Success: false, Message: "Unauthorized"})
		return
	}
	userIDStr := userIDInterface.(string)
	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		c.JSON(http.StatusUnauthorized, types.ErrorResponse{Success: false, Message: "Invalid user ID"})
		return
	}

	var req EnrollRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, types.ErrorResponse{Success: false, Message: "Validation failed", Error: err.Error()})
		return
	}

	// Fetch the course
	var course models.Course
	if err := h.db.First(&course, req.CourseID).Error; err != nil {
		c.JSON(http.StatusNotFound, types.ErrorResponse{Success: false, Message: "Course not found"})
		return
	}

	if !course.IsActive {
		c.JSON(http.StatusBadRequest, types.ErrorResponse{Success: false, Message: "Course is not available for enrollment"})
		return
	}

	// Check capacity
	if course.Capacity != nil && course.Enrolled >= *course.Capacity {
		c.JSON(http.StatusBadRequest, types.ErrorResponse{Success: false, Message: "Course is full"})
		return
	}

	// Check if already enrolled
	var existing models.Enrollment
	result := h.db.Where("user_id = ? AND course_id = ?", userID, req.CourseID).First(&existing)
	if result.Error == nil {
		c.JSON(http.StatusConflict, types.ErrorResponse{
			Success: false,
			Message: "Already enrolled in this course",
		})
		return
	}

	now := time.Now()
	enrollment := models.Enrollment{
		UserID:   userID,
		CourseID: req.CourseID,
	}

	if course.IsFree {
		enrollment.PaymentStatus = models.EnrollmentStatusFree
		enrollment.EnrolledAt = &now
	} else {
		enrollment.PaymentStatus = models.EnrollmentStatusPending
		enrollment.Currency = course.Currency
	}

	if err := h.db.Create(&enrollment).Error; err != nil {
		c.JSON(http.StatusInternalServerError, types.ErrorResponse{
			Success: false,
			Message: "Failed to enroll",
			Error:   err.Error(),
		})
		return
	}

	// Increment enrolled count on the course
	h.db.Model(&models.Course{}).Where("id = ?", req.CourseID).
		UpdateColumn("enrolled", gorm.Expr("enrolled + ?", 1))

	h.db.Preload("User").Preload("Course").First(&enrollment, enrollment.ID)

	c.JSON(http.StatusCreated, types.SuccessResponse{
		Success: true,
		Data:    enrollment,
	})
}
