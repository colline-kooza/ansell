package handlers

import (
	"fmt"
	"net/http"
	"strconv"

	"ansell-backend-api/internal/models"
	"ansell-backend-api/internal/types"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"gorm.io/gorm"
)


type JobHandler struct {
	db *gorm.DB
}

func NewJobHandler(db *gorm.DB) *JobHandler {
	return &JobHandler{db: db}
}

// GET /api/jobs
func (h *JobHandler) ListPublicJobs(c *gin.Context) {
	category := c.Query("category")
	jobType := c.Query("job_type")
	expLevel := c.Query("experience_level")
	careerLevel := c.Query("career_level")
	salaryMinStr := c.Query("salary_min")
	salaryMaxStr := c.Query("salary_max")
	city := c.Query("city")
	search := c.Query("search")
	isFeatured := c.Query("is_featured")
	companyId := c.Query("company_id")
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "20"))
	
	if page < 1 { page = 1 }
	offset := (page - 1) * pageSize

	query := h.db.Model(&models.Job{}).Preload("Company").Where("status = ?", "active").Where("is_active = ?", true)

	if category != "" { query = query.Where("category = ?", category) }
	if jobType != "" { query = query.Where("job_type = ?", jobType) }
	if expLevel != "" { query = query.Where("experience_level = ?", expLevel) }
	if careerLevel != "" { query = query.Where("career_level = ?", careerLevel) }
	if salaryMinStr != "" {
		if salaryMin, err := strconv.ParseFloat(salaryMinStr, 64); err == nil {
			query = query.Where("salary_max >= ? OR salary_min >= ?", salaryMin, salaryMin)
		}
	}
	if salaryMaxStr != "" {
		if salaryMax, err := strconv.ParseFloat(salaryMaxStr, 64); err == nil {
			query = query.Where("salary_min <= ? OR salary_max <= ?", salaryMax, salaryMax)
		}
	}
	if city != "" { query = query.Where("city = ?", city) }
	if isFeatured == "true" { query = query.Where("is_featured = ?", true) }
	if companyId != "" { query = query.Where("company_id = ?", companyId) }
	if search != "" {
		query = query.Where("title ILIKE ? OR description ILIKE ?", "%"+search+"%", "%"+search+"%")
	}

	var total int64
	query.Count(&total)

	var jobs []models.Job
	if err := query.Order("is_featured desc, created_at desc").Offset(offset).Limit(pageSize).Find(&jobs).Error; err != nil {
		c.JSON(http.StatusInternalServerError, types.ErrorResponse{
			Success: false,
			Message: "Failed to fetch jobs",
		})
		return
	}

	totalPages := int(total) / pageSize
	if int(total)%pageSize != 0 { totalPages++ }

	c.JSON(http.StatusOK, types.PaginatedResponse{
		Success:    true,
		Message:    "Jobs fetched",
		Data:       jobs,
		Page:       page,
		PageSize:   pageSize,
		TotalItems: total,
		TotalPages: totalPages,
	})
}

// GET /api/jobs/:id
func (h *JobHandler) GetPublicJob(c *gin.Context) {
	id := c.Param("id")
	var job models.Job
	if err := h.db.Preload("Company").First(&job, "id = ?", id).Error; err != nil {
		c.JSON(http.StatusNotFound, types.ErrorResponse{
			Success: false,
			Message: "Job not found",
		})
		return
	}

	// Increment views
	h.db.Model(&job).UpdateColumn("views", gorm.Expr("views + ?", 1))

	c.JSON(http.StatusOK, types.SuccessResponse{
		Success: true,
		Message: "Job fetched",
		Data:    job,
	})
}

// POST /api/jobs/:id/apply
func (h *JobHandler) ApplyToJob(c *gin.Context) {
	jobIDStr := c.Param("id")
	jobID, _ := uuid.Parse(jobIDStr)

	var req types.SubmitJobApplicationRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, types.ErrorResponse{
			Success: false,
			Message: "Validation failed",
			Error:   err.Error(),
		})
		return
	}

	// Check if already applied
	var existing models.JobApplication
	if err := h.db.Where("job_id = ? AND email = ?", jobID, req.Email).First(&existing).Error; err == nil {
		c.JSON(http.StatusConflict, types.ErrorResponse{
			Success: false,
			Message: "You have already applied for this position",
		})
		return
	}

	app := models.JobApplication{
		JobID:             jobID,
		FullName:          req.FullName,
		Email:             req.Email,
		Phone:             req.Phone,
		CoverLetter:       req.CoverLetter,
		CVUrl:             req.CVUrl,
		LinkedInURL:       req.LinkedInURL,
		PortfolioURL:      req.PortfolioURL,
		YearsOfExperience: req.YearsOfExperience,
		CurrentJobTitle:   req.CurrentJobTitle,
		Status:            "submitted",
	}

	// If authenticated, attach applicant_id
	if userID, exists := c.Get("user_id"); exists {
		uID, _ := uuid.Parse(userID.(string))
		app.ApplicantID = &uID
	}

	if err := h.db.Transaction(func(tx *gorm.DB) error {
		if err := tx.Create(&app).Error; err != nil {
			return err
		}
		// Increment job application count
		if err := tx.Model(&models.Job{}).Where("id = ?", jobID).UpdateColumn("application_count", gorm.Expr("application_count + ?", 1)).Error; err != nil {
			return err
		}
		return nil
	}); err != nil {
		c.JSON(http.StatusInternalServerError, types.ErrorResponse{
			Success: false,
			Message: "Failed to submit application",
		})
		return
	}

	c.JSON(http.StatusCreated, types.SuccessResponse{
		Success: true,
		Message: "Application submitted successfully",
		Data:    app,
	})
}

// GET /api/jobs/categories
func (h *JobHandler) GetCategories(c *gin.Context) {
	type CategoryCount struct {
		Category string `json:"category"`
		Label    string `json:"label"`
		Count    int64  `json:"count"`
	}

	var results []CategoryCount
	h.db.Model(&models.Job{}).Where("status = ?", "active").Select("category, count(*) as count").Group("category").Scan(&results)

	// Map internal names to display labels if needed
	labels := map[string]string{
		"ngo_un":          "NGO & UN",
		"government":      "Government",
		"private_sector":  "Private Sector",
		"international":   "International",
		"startup":         "Startup",
	}

	for i, r := range results {
		if l, ok := labels[r.Category]; ok {
			results[i].Label = l
		} else {
			results[i].Label = r.Category
		}
	}

	c.JSON(http.StatusOK, types.SuccessResponse{
		Success: true,
		Data:    results,
	})
}

// ─────────────────────────────────────
// Company Owner Methods
// ─────────────────────────────────────

// GET /api/company-owner/jobs
func (h *JobHandler) ListOwnerJobs(c *gin.Context) {
	userIDStr, _ := c.Get("user_id")
	userID, _ := uuid.Parse(userIDStr.(string))

	var company models.Company
	if err := h.db.First(&company, "owner_id = ?", userID).Error; err != nil {
		c.JSON(http.StatusForbidden, types.ErrorResponse{Success: false, Message: "No company associated with this account"})
		return
	}

	status := c.Query("status")
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "20"))
	
	if page < 1 { page = 1 }
	offset := (page - 1) * pageSize

	query := h.db.Model(&models.Job{}).Where("company_id = ?", company.ID)
	if status != "" { query = query.Where("status = ?", status) }

	var total int64
	query.Count(&total)

	var jobs []models.Job
	if err := query.Order("created_at desc").Offset(offset).Limit(pageSize).Find(&jobs).Error; err != nil {
		c.JSON(http.StatusInternalServerError, types.ErrorResponse{Success: false, Message: "Failed to fetch jobs"})
		return
	}

	totalPages := int(total) / pageSize
	if int(total)%pageSize != 0 { totalPages++ }

	c.JSON(http.StatusOK, types.PaginatedResponse{
		Success: true, Data: jobs, Page: page, PageSize: pageSize, TotalItems: total, TotalPages: totalPages,
	})
}

// POST /api/company-owner/jobs
func (h *JobHandler) CreateOwnerJob(c *gin.Context) {
	userIDStr, _ := c.Get("user_id")
	userID, _ := uuid.Parse(userIDStr.(string))

	var company models.Company
	if err := h.db.First(&company, "owner_id = ?", userID).Error; err != nil {
		c.JSON(http.StatusForbidden, types.ErrorResponse{Success: false, Message: "No company associated with this account"})
		return
	}

	var req types.CreateJobRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, types.ErrorResponse{Success: false, Message: "Validation failed", Error: err.Error()})
		return
	}

	job := models.Job{
		CompanyID:          &company.ID,
		PostedByID:         userID,
		Title:              req.Title,
		Description:        req.Description,
		Category:           req.Category,
		JobType:            req.JobType,
		ExperienceLevel:    req.ExperienceLevel,
		CareerLevel:        req.CareerLevel,
		SalaryMin:          req.SalaryMin,
		SalaryMax:          req.SalaryMax,
		SalaryCurrency:     req.SalaryCurrency,
		SalaryPeriod:       req.SalaryPeriod,
		IsSalaryVisible:    req.IsSalaryVisible,
		City:               req.City,
		Location:           req.Location,
		Skills:             req.Skills,
		Qualifications:     req.Qualifications,
		ApplicationDeadline: req.ApplicationDeadline,
		ApplicationEmail:   req.ApplicationEmail,
		ApplicationURL:     req.ApplicationURL,
		ApplicationType:    req.ApplicationType,
		IsFeatured:         req.IsFeatured,
		Status:             "pending_review",
	}

	if err := h.db.Create(&job).Error; err != nil {
		c.JSON(http.StatusInternalServerError, types.ErrorResponse{Success: false, Message: "Failed to create job"})
		return
	}

	c.JSON(http.StatusCreated, types.SuccessResponse{Success: true, Message: "Job created and pending review", Data: job})
}

// PUT /api/company-owner/jobs/:id
func (h *JobHandler) UpdateOwnerJob(c *gin.Context) {
	userIDStr, _ := c.Get("user_id")
	userID, _ := uuid.Parse(userIDStr.(string))

	id := c.Param("id")
	var job models.Job
	if err := h.db.First(&job, "id = ?", id).Error; err != nil {
		c.JSON(http.StatusNotFound, types.ErrorResponse{Success: false, Message: "Job not found"})
		return
	}

	// Verify ownership via Company
	var company models.Company
	if err := h.db.First(&company, "id = ? AND owner_id = ?", job.CompanyID, userID).Error; err != nil {
		c.JSON(http.StatusForbidden, types.ErrorResponse{Success: false, Message: "Unauthorized"})
		return
	}

	var req types.UpdateJobRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, types.ErrorResponse{Success: false, Message: "Invalid request"})
		return
	}

	// Manual updates to avoid status change by owner
	updates := map[string]interface{}{}
	if req.Title != "" { updates["title"] = req.Title }
	if req.Description != "" { updates["description"] = req.Description }
	if req.Category != "" { updates["category"] = req.Category }
	if req.JobType != "" { updates["job_type"] = req.JobType }
	if req.ExperienceLevel != "" { updates["experience_level"] = req.ExperienceLevel }
	if req.CareerLevel != "" { updates["career_level"] = req.CareerLevel }
	if req.SalaryMin != nil { updates["salary_min"] = req.SalaryMin }
	if req.SalaryMax != nil { updates["salary_max"] = req.SalaryMax }
	if req.SalaryCurrency != "" { updates["salary_currency"] = req.SalaryCurrency }
	if req.SalaryPeriod != "" { updates["salary_period"] = req.SalaryPeriod }
	if req.IsSalaryVisible != nil { updates["is_salary_visible"] = *req.IsSalaryVisible }
	if req.City != "" { updates["city"] = req.City }
	if req.Location != "" { updates["location"] = req.Location }
	if req.Skills != "" { updates["skills"] = req.Skills }
	if req.Qualifications != "" { updates["qualifications"] = req.Qualifications }
	if req.ApplicationDeadline != nil { updates["application_deadline"] = req.ApplicationDeadline }
	if req.ApplicationEmail != "" { updates["application_email"] = req.ApplicationEmail }
	if req.ApplicationURL != "" { updates["application_url"] = req.ApplicationURL }
	if req.ApplicationType != "" { updates["application_type"] = req.ApplicationType }
	if req.IsFeatured != nil { updates["is_featured"] = *req.IsFeatured }

	if err := h.db.Model(&job).Updates(updates).Error; err != nil {
		c.JSON(http.StatusInternalServerError, types.ErrorResponse{Success: false, Message: "Failed to update job"})
		return
	}

	c.JSON(http.StatusOK, types.SuccessResponse{Success: true, Message: "Job updated", Data: job})
}

// DELETE /api/company-owner/jobs/:id
func (h *JobHandler) DeleteOwnerJob(c *gin.Context) {
	userIDStr, _ := c.Get("user_id")
	userID, _ := uuid.Parse(userIDStr.(string))

	id := c.Param("id")
	var job models.Job
	if err := h.db.First(&job, "id = ?", id).Error; err != nil {
		c.JSON(http.StatusNotFound, types.ErrorResponse{Success: false, Message: "Job not found"})
		return
	}

	// Verify ownership via Company
	var company models.Company
	if err := h.db.First(&company, "id = ? AND owner_id = ?", job.CompanyID, userID).Error; err != nil {
		c.JSON(http.StatusForbidden, types.ErrorResponse{Success: false, Message: "Unauthorized"})
		return
	}

	if err := h.db.Delete(&job).Error; err != nil {
		c.JSON(http.StatusInternalServerError, types.ErrorResponse{Success: false, Message: "Failed to delete job"})
		return
	}

	c.JSON(http.StatusOK, types.SuccessResponse{Success: true, Message: "Job deleted"})
}

// GET /api/company-owner/applications
func (h *JobHandler) ListOwnerApplications(c *gin.Context) {
	userIDStr, _ := c.Get("user_id")
	userID, _ := uuid.Parse(userIDStr.(string))

	var company models.Company
	if err := h.db.First(&company, "owner_id = ?", userID).Error; err != nil {
		c.JSON(http.StatusForbidden, types.ErrorResponse{Success: false, Message: "Unauthorized"})
		return
	}

	jobID := c.Query("job_id")
	status := c.Query("status")
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "20"))
	
	if page < 1 { page = 1 }
	offset := (page - 1) * pageSize

	query := h.db.Model(&models.JobApplication{}).Joins("JOIN jobs ON jobs.id = job_applications.job_id").Where("jobs.company_id = ?", company.ID).Preload("Job")

	if jobID != "" { query = query.Where("job_applications.job_id = ?", jobID) }
	if status != "" { query = query.Where("job_applications.status = ?", status) }

	var total int64
	query.Count(&total)

	var apps []models.JobApplication
	if err := query.Order("job_applications.created_at desc").Offset(offset).Limit(pageSize).Find(&apps).Error; err != nil {
		c.JSON(http.StatusInternalServerError, types.ErrorResponse{Success: false, Message: "Failed to fetch applications"})
		return
	}

	totalPages := int(total) / pageSize
	if int(total)%pageSize != 0 { totalPages++ }

	c.JSON(http.StatusOK, types.PaginatedResponse{
		Success: true, Data: apps, Page: page, PageSize: pageSize, TotalItems: total, TotalPages: totalPages,
	})
}

// PATCH /api/company-owner/applications/:id/status
func (h *JobHandler) UpdateApplicationStatus(c *gin.Context) {
	userIDStr, _ := c.Get("user_id")
	userID, _ := uuid.Parse(userIDStr.(string))

	id := c.Param("id")
	var app models.JobApplication
	if err := h.db.Preload("Job").First(&app, "id = ?", id).Error; err != nil {
		c.JSON(http.StatusNotFound, types.ErrorResponse{Success: false, Message: "Application not found"})
		return
	}

	// Verify company ownership of the job
	var company models.Company
	if err := h.db.First(&company, "id = ? AND owner_id = ?", app.Job.CompanyID, userID).Error; err != nil {
		c.JSON(http.StatusForbidden, types.ErrorResponse{Success: false, Message: "Unauthorized"})
		return
	}

	var req types.UpdateApplicationStatusRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, types.ErrorResponse{Success: false, Message: "Invalid request"})
		return
	}

	app.Status = req.Status
	app.ReviewNote = req.ReviewNote

	if err := h.db.Save(&app).Error; err != nil {
		c.JSON(http.StatusInternalServerError, types.ErrorResponse{Success: false, Message: "Failed to update application status"})
		return
	}

	c.JSON(http.StatusOK, types.SuccessResponse{Success: true, Message: "Application status updated", Data: app})
}

// ─────────────────────────────────────
// Admin Methods
// ─────────────────────────────────────

// GET /api/admin/jobs
func (h *JobHandler) AdminListJobs(c *gin.Context) {
	status := c.Query("status")
	category := c.Query("category")
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "20"))
	
	if page < 1 { page = 1 }
	offset := (page - 1) * pageSize

	query := h.db.Model(&models.Job{}).Preload("Company")
	if status != "" { query = query.Where("status = ?", status) }
	if category != "" { query = query.Where("category = ?", category) }

	var total int64
	query.Count(&total)

	var jobs []models.Job
	if err := query.Order("created_at desc").Offset(offset).Limit(pageSize).Find(&jobs).Error; err != nil {
		c.JSON(http.StatusInternalServerError, types.ErrorResponse{Success: false, Message: "Failed to fetch jobs"})
		return
	}

	totalPages := int(total) / pageSize
	if int(total)%pageSize != 0 { totalPages++ }

	c.JSON(http.StatusOK, types.PaginatedResponse{
		Success: true, Data: jobs, Page: page, PageSize: pageSize, TotalItems: total, TotalPages: totalPages,
	})
}

// POST /api/admin/jobs
func (h *JobHandler) AdminCreateJob(c *gin.Context) {
	adminIDStr, _ := c.Get("user_id")
	adminID, _ := uuid.Parse(adminIDStr.(string))

	var req types.CreateJobRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, types.ErrorResponse{Success: false, Message: "Validation failed", Error: err.Error()})
		return
	}

	cID, err := h.resolveAdminCompanyID(adminID, req.CompanyID)
	if err != nil {
		c.JSON(http.StatusBadRequest, types.ErrorResponse{Success: false, Message: err.Error()})
		return
	}

	job := models.Job{
		CompanyID:          cID,
		PostedByID:         adminID,
		Title:              req.Title,
		Description:        req.Description,
		Category:           req.Category,
		JobType:            req.JobType,
		ExperienceLevel:    req.ExperienceLevel,
		CareerLevel:        req.CareerLevel,
		SalaryMin:          req.SalaryMin,
		SalaryMax:          req.SalaryMax,
		SalaryCurrency:     req.SalaryCurrency,
		SalaryPeriod:       req.SalaryPeriod,
		IsSalaryVisible:    req.IsSalaryVisible,
		City:               req.City,
		Location:           req.Location,
		Skills:             req.Skills,
		Qualifications:     req.Qualifications,
		ApplicationDeadline: req.ApplicationDeadline,
		ApplicationEmail:   req.ApplicationEmail,
		ApplicationURL:     req.ApplicationURL,
		ApplicationType:    req.ApplicationType,
		IsFeatured:         req.IsFeatured,
		Status:             "active", // Admin created jobs are active by default
	}

	if err := h.db.Create(&job).Error; err != nil {
		c.JSON(http.StatusInternalServerError, types.ErrorResponse{Success: false, Message: "Failed to create job", Error: err.Error()})
		return
	}

	c.JSON(http.StatusCreated, types.SuccessResponse{Success: true, Message: "Job created", Data: job})
}

func (h *JobHandler) resolveAdminCompanyID(adminID uuid.UUID, requestedCompanyID string) (*uuid.UUID, error) {
	if requestedCompanyID != "" {
		parsed, err := uuid.Parse(requestedCompanyID)
		if err != nil {
			return nil, fmt.Errorf("invalid company ID")
		}

		var company models.Company
		if err := h.db.First(&company, "id = ?", parsed).Error; err != nil {
			if err == gorm.ErrRecordNotFound {
				return nil, fmt.Errorf("selected company was not found")
			}
			return nil, fmt.Errorf("failed to resolve company")
		}

		return &company.ID, nil
	}

	var company models.Company
	if err := h.db.Where("owner_id = ?", adminID).Order("created_at asc").First(&company).Error; err == nil {
		return &company.ID, nil
	} else if err != gorm.ErrRecordNotFound {
		return nil, fmt.Errorf("failed to load the default admin company")
	}

	var admin models.User
	if err := h.db.First(&admin, "id = ?", adminID).Error; err != nil {
		return nil, fmt.Errorf("failed to load the admin account")
	}

	company = models.Company{
		OwnerID:       adminID,
		CompanyName:   "Ansell",
		CompanyType:   "platform",
		Industry:      "Marketplace",
		Email:         admin.Email,
		City:          "Juba",
		Description:   "Default platform company for administrator-posted jobs.",
		EmployeeCount: "1-10",
		IsVerified:    true,
		IsActive:      true,
	}

	if err := h.db.Create(&company).Error; err != nil {
		return nil, fmt.Errorf("failed to create the default admin company")
	}

	return &company.ID, nil
}

// PATCH /api/admin/jobs/:id/approve
func (h *JobHandler) AdminApproveJob(c *gin.Context) {
	id := c.Param("id")
	if err := h.db.Model(&models.Job{}).Where("id = ?", id).Update("status", "active").Error; err != nil {
		c.JSON(http.StatusInternalServerError, types.ErrorResponse{Success: false, Message: "Failed to approve job"})
		return
	}
	c.JSON(http.StatusOK, types.SuccessResponse{Success: true, Message: "Job approved and live"})
}

// PATCH /api/admin/jobs/:id/reject
func (h *JobHandler) AdminRejectJob(c *gin.Context) {
	id := c.Param("id")
	if err := h.db.Model(&models.Job{}).Where("id = ?", id).Update("status", "rejected").Error; err != nil {
		c.JSON(http.StatusInternalServerError, types.ErrorResponse{Success: false, Message: "Failed to reject job"})
		return
	}
	c.JSON(http.StatusOK, types.SuccessResponse{Success: true, Message: "Job rejected"})
}

// PATCH /api/admin/jobs/:id/feature
func (h *JobHandler) AdminFeatureJob(c *gin.Context) {
	id := c.Param("id")
	var job models.Job
	if err := h.db.First(&job, "id = ?", id).Error; err != nil {
		c.JSON(http.StatusNotFound, types.ErrorResponse{Success: false, Message: "Job not found"})
		return
	}

	job.IsFeatured = !job.IsFeatured
	h.db.Save(&job)

	c.JSON(http.StatusOK, types.SuccessResponse{Success: true, Message: "Job feature status updated", Data: job})
}

// GET /api/admin/applications
func (h *JobHandler) AdminListApplications(c *gin.Context) {
	jobID := c.Query("job_id")
	status := c.Query("status")
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "20"))
	
	if page < 1 { page = 1 }
	offset := (page - 1) * pageSize

	query := h.db.Model(&models.JobApplication{}).Preload("Job").Preload("Job.Company")

	if jobID != "" { query = query.Where("job_id = ?", jobID) }
	if status != "" { query = query.Where("status = ?", status) }

	var total int64
	query.Count(&total)

	var apps []models.JobApplication
	if err := query.Order("created_at desc").Offset(offset).Limit(pageSize).Find(&apps).Error; err != nil {
		c.JSON(http.StatusInternalServerError, types.ErrorResponse{Success: false, Message: "Failed to fetch applications"})
		return
	}

	totalPages := int(total) / pageSize
	if int(total)%pageSize != 0 { totalPages++ }

	c.JSON(http.StatusOK, types.PaginatedResponse{
		Success: true, Data: apps, Page: page, PageSize: pageSize, TotalItems: total, TotalPages: totalPages,
	})
}

// PATCH /api/admin/applications/:id/status
func (h *JobHandler) AdminUpdateApplicationStatus(c *gin.Context) {
	id := c.Param("id")
	var app models.JobApplication
	if err := h.db.First(&app, "id = ?", id).Error; err != nil {
		c.JSON(http.StatusNotFound, types.ErrorResponse{Success: false, Message: "Application not found"})
		return
	}

	var req types.UpdateApplicationStatusRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, types.ErrorResponse{Success: false, Message: "Invalid request"})
		return
	}

	app.Status = req.Status
	app.ReviewNote = req.ReviewNote

	if err := h.db.Save(&app).Error; err != nil {
		c.JSON(http.StatusInternalServerError, types.ErrorResponse{Success: false, Message: "Failed to update application status"})
		return
	}

	c.JSON(http.StatusOK, types.SuccessResponse{Success: true, Message: "Application status updated", Data: app})
}

// GET /api/user/applications
func (h *JobHandler) ListUserApplications(c *gin.Context) {
	userIDStr, _ := c.Get("user_id")
	userID, _ := uuid.Parse(userIDStr.(string))

	var apps []models.JobApplication
	if err := h.db.Preload("Job").Preload("Job.Company").Where("applicant_id = ?", userID).Order("created_at desc").Find(&apps).Error; err != nil {
		c.JSON(http.StatusInternalServerError, types.ErrorResponse{Success: false, Message: "Failed to fetch applications"})
		return
	}

	c.JSON(http.StatusOK, types.SuccessResponse{Success: true, Data: apps})
}
