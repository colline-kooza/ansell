package handlers

import (
	"encoding/json"
	"net/http"
	"strconv"
	"strings"
	"time"

	"ansell-backend-api/internal/models"
	"ansell-backend-api/internal/types"
	"ansell-backend-api/internal/utils"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type ArticleHandler struct {
	db *gorm.DB
}

type articleListMeta struct {
	Total int64 `json:"total"`
	Page  int   `json:"page"`
	Pages int   `json:"pages"`
}

type articleListResponse struct {
	Success bool            `json:"success"`
	Message string          `json:"message"`
	Data    interface{}     `json:"data"`
	Meta    articleListMeta `json:"meta,omitempty"`
}

type feedPreferenceResponse struct {
	ID         uint      `json:"id,omitempty"`
	UserID     string    `json:"user_id,omitempty"`
	Categories []string  `json:"categories"`
	CreatedAt  time.Time `json:"created_at,omitempty"`
	UpdatedAt  time.Time `json:"updated_at,omitempty"`
}

var articleCategoryLabels = map[string]string{
	string(models.ArticleCategoryBusiness):        "Business",
	string(models.ArticleCategoryGovernment):      "Government",
	string(models.ArticleCategoryNGOHumanitarian): "NGO & Humanitarian",
	string(models.ArticleCategoryInfrastructure):  "Infrastructure",
	string(models.ArticleCategoryOilGas):          "Oil & Gas",
	string(models.ArticleCategoryTechnology):      "Technology",
	string(models.ArticleCategoryAgriculture):     "Agriculture",
	string(models.ArticleCategoryHealth):          "Health",
	string(models.ArticleCategoryEducation):       "Education",
	string(models.ArticleCategoryEconomy):         "Economy",
	string(models.ArticleCategoryGeneral):         "General",
}

func NewArticleHandler(db *gorm.DB) *ArticleHandler {
	return &ArticleHandler{db: db}
}

// GET /api/articles
func (h *ArticleHandler) ListPublicArticles(c *gin.Context) {
	page, pageSize := parseArticlePagination(c)
	query := h.db.Model(&models.Article{}).
		Where("is_published = ?", true).
		Preload("Author", func(db *gorm.DB) *gorm.DB {
			return db.Select("id", "first_name", "last_name", "avatar")
		})

	query = applyArticleFilters(c, query, false)

	var total int64
	if err := query.Count(&total).Error; err != nil {
		c.JSON(http.StatusInternalServerError, types.ErrorResponse{
			Success: false,
			Message: "Failed to count articles",
			Error:   err.Error(),
		})
		return
	}

	var articles []models.Article
	if err := applyPublicArticleSort(query, c.Query("sort")).
		Offset((page - 1) * pageSize).
		Limit(pageSize).
		Find(&articles).Error; err != nil {
		c.JSON(http.StatusInternalServerError, types.ErrorResponse{
			Success: false,
			Message: "Failed to fetch articles",
			Error:   err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, articleListResponse{
		Success: true,
		Message: "Articles fetched",
		Data:    articles,
		Meta:    buildArticleListMeta(total, page, pageSize),
	})
}

// GET /api/articles/featured
func (h *ArticleHandler) ListFeaturedArticles(c *gin.Context) {
	var articles []models.Article
	if err := h.db.Where("is_published = ? AND is_featured = ?", true, true).
		Preload("Author", func(db *gorm.DB) *gorm.DB {
			return db.Select("id", "first_name", "last_name", "avatar")
		}).
		Order("published_at desc").
		Limit(5).
		Find(&articles).Error; err != nil {
		c.JSON(http.StatusInternalServerError, types.ErrorResponse{
			Success: false,
			Message: "Failed to fetch featured articles",
			Error:   err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, types.SuccessResponse{
		Success: true,
		Message: "Featured articles fetched",
		Data:    articles,
	})
}

// GET /api/articles/categories
func (h *ArticleHandler) GetArticleCategories(c *gin.Context) {
	var results []struct {
		Category string `json:"category"`
		Count    int64  `json:"count"`
	}

	if err := h.db.Model(&models.Article{}).
		Where("is_published = ?", true).
		Select("category, count(*) as count").
		Group("category").
		Order("category asc").
		Scan(&results).Error; err != nil {
		c.JSON(http.StatusInternalServerError, types.ErrorResponse{
			Success: false,
			Message: "Failed to fetch article categories",
			Error:   err.Error(),
		})
		return
	}

	response := make([]gin.H, 0, len(results))
	for _, result := range results {
		response = append(response, gin.H{
			"category": result.Category,
			"label":    articleCategoryLabels[result.Category],
			"count":    result.Count,
		})
	}

	c.JSON(http.StatusOK, types.SuccessResponse{
		Success: true,
		Message: "Article categories fetched",
		Data:    response,
	})
}

// GET /api/articles/:slug
func (h *ArticleHandler) GetPublicArticle(c *gin.Context) {
	slug := c.Param("slug")

	var article models.Article
	if err := h.db.Where("slug = ? AND is_published = ?", slug, true).
		Preload("Author").
		First(&article).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, types.ErrorResponse{
				Success: false,
				Message: "Article not found",
			})
			return
		}

		c.JSON(http.StatusInternalServerError, types.ErrorResponse{
			Success: false,
			Message: "Failed to fetch article",
			Error:   err.Error(),
		})
		return
	}

	if err := h.db.Model(&models.Article{}).
		Where("id = ?", article.ID).
		UpdateColumn("views", gorm.Expr("views + ?", 1)).Error; err == nil {
		article.Views++
	}

	c.JSON(http.StatusOK, types.SuccessResponse{
		Success: true,
		Message: "Article fetched",
		Data:    article,
	})
}

// GET /api/articles/related/:slug
func (h *ArticleHandler) GetRelatedArticles(c *gin.Context) {
	slug := c.Param("slug")

	var current models.Article
	if err := h.db.Select("id", "slug", "category").
		Where("slug = ? AND is_published = ?", slug, true).
		First(&current).Error; err != nil {
		c.JSON(http.StatusNotFound, types.ErrorResponse{
			Success: false,
			Message: "Article not found",
		})
		return
	}

	var related []models.Article
	if err := h.db.Where("is_published = ? AND category = ? AND id <> ?", true, current.Category, current.ID).
		Preload("Author", func(db *gorm.DB) *gorm.DB {
			return db.Select("id", "first_name", "last_name", "avatar")
		}).
		Order("published_at desc").
		Limit(4).
		Find(&related).Error; err != nil {
		c.JSON(http.StatusInternalServerError, types.ErrorResponse{
			Success: false,
			Message: "Failed to fetch related articles",
			Error:   err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, types.SuccessResponse{
		Success: true,
		Message: "Related articles fetched",
		Data:    related,
	})
}

// GET /api/feed/preferences
func (h *ArticleHandler) GetFeedPreferences(c *gin.Context) {
	userID, ok := getArticleUserID(c)
	if !ok {
		return
	}

	var preference models.UserFeedPreference
	if err := h.db.Where("user_id = ?", userID).First(&preference).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusOK, types.SuccessResponse{
				Success: true,
				Message: "Feed preferences fetched",
				Data: feedPreferenceResponse{
					Categories: []string{},
				},
			})
			return
		}

		c.JSON(http.StatusInternalServerError, types.ErrorResponse{
			Success: false,
			Message: "Failed to fetch feed preferences",
			Error:   err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, types.SuccessResponse{
		Success: true,
		Message: "Feed preferences fetched",
		Data:    toFeedPreferenceResponse(preference),
	})
}

// PUT /api/feed/preferences
func (h *ArticleHandler) UpdateFeedPreferences(c *gin.Context) {
	userID, ok := getArticleUserID(c)
	if !ok {
		return
	}

	var req types.UpdateFeedPreferenceRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, types.ErrorResponse{
			Success: false,
			Message: "Validation failed",
			Error:   err.Error(),
		})
		return
	}

	categoriesJSON, err := json.Marshal(req.Categories)
	if err != nil {
		c.JSON(http.StatusBadRequest, types.ErrorResponse{
			Success: false,
			Message: "Invalid categories",
			Error:   err.Error(),
		})
		return
	}

	preference := models.UserFeedPreference{UserID: userID}
	if err := h.db.Where("user_id = ?", userID).
		Assign(models.UserFeedPreference{Categories: string(categoriesJSON)}).
		FirstOrCreate(&preference).Error; err != nil {
		c.JSON(http.StatusInternalServerError, types.ErrorResponse{
			Success: false,
			Message: "Failed to save feed preferences",
			Error:   err.Error(),
		})
		return
	}

	if err := h.db.First(&preference, preference.ID).Error; err != nil {
		c.JSON(http.StatusInternalServerError, types.ErrorResponse{
			Success: false,
			Message: "Failed to load saved feed preferences",
			Error:   err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, types.SuccessResponse{
		Success: true,
		Message: "Feed preferences saved",
		Data:    toFeedPreferenceResponse(preference),
	})
}

// GET /api/admin/articles
func (h *ArticleHandler) ListAdminArticles(c *gin.Context) {
	page, pageSize := parseArticlePagination(c)
	query := h.db.Model(&models.Article{}).
		Preload("Author", func(db *gorm.DB) *gorm.DB {
			return db.Select("id", "first_name", "last_name", "avatar")
		})

	query = applyArticleFilters(c, query, true)

	var total int64
	if err := query.Count(&total).Error; err != nil {
		c.JSON(http.StatusInternalServerError, types.ErrorResponse{
			Success: false,
			Message: "Failed to count articles",
			Error:   err.Error(),
		})
		return
	}

	var articles []models.Article
	if err := query.Order("created_at desc").
		Offset((page - 1) * pageSize).
		Limit(pageSize).
		Find(&articles).Error; err != nil {
		c.JSON(http.StatusInternalServerError, types.ErrorResponse{
			Success: false,
			Message: "Failed to fetch articles",
			Error:   err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, articleListResponse{
		Success: true,
		Message: "Articles fetched",
		Data:    articles,
		Meta:    buildArticleListMeta(total, page, pageSize),
	})
}

// GET /api/admin/articles/:id
func (h *ArticleHandler) GetAdminArticle(c *gin.Context) {
	id := c.Param("id")

	var article models.Article
	if err := h.db.Preload("Author").First(&article, id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, types.ErrorResponse{
				Success: false,
				Message: "Article not found",
			})
			return
		}

		c.JSON(http.StatusInternalServerError, types.ErrorResponse{
			Success: false,
			Message: "Failed to fetch article",
			Error:   err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, types.SuccessResponse{
		Success: true,
		Message: "Article fetched",
		Data:    article,
	})
}

// POST /api/admin/articles
func (h *ArticleHandler) CreateArticle(c *gin.Context) {
	userID, ok := getArticleUserID(c)
	if !ok {
		return
	}

	var req types.CreateArticleRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, types.ErrorResponse{
			Success: false,
			Message: "Validation failed",
			Error:   err.Error(),
		})
		return
	}

	if strings.TrimSpace(req.CoverImageURL) == "" {
		c.JSON(http.StatusBadRequest, types.ErrorResponse{
			Success: false,
			Message: "Cover image is required",
		})
		return
	}

	slug, err := utils.GenerateUniqueArticleSlug(h.db, req.Title, nil)
	if err != nil {
		c.JSON(http.StatusInternalServerError, types.ErrorResponse{
			Success: false,
			Message: "Failed to generate article slug",
			Error:   err.Error(),
		})
		return
	}

	tagsJSON, err := json.Marshal(req.Tags)
	if err != nil {
		c.JSON(http.StatusBadRequest, types.ErrorResponse{
			Success: false,
			Message: "Invalid tags",
			Error:   err.Error(),
		})
		return
	}

	readTime := utils.CalculateArticleReadTimeMinutes(req.Content)
	var publishedAt *time.Time
	if req.IsPublished {
		now := time.Now().UTC()
		publishedAt = &now
	}

	article := models.Article{
		AuthorID:        userID,
		Title:           strings.TrimSpace(req.Title),
		Slug:            slug,
		Excerpt:         strings.TrimSpace(req.Excerpt),
		Content:         req.Content,
		CoverImageURL:   strings.TrimSpace(req.CoverImageURL),
		Category:        models.ArticleCategory(req.Category),
		Tags:            string(tagsJSON),
		IsFeatured:      req.IsFeatured,
		IsPublished:     req.IsPublished,
		PublishedAt:     publishedAt,
		ReadTimeMinutes: readTime,
	}

	if err := h.db.Create(&article).Error; err != nil {
		c.JSON(http.StatusInternalServerError, types.ErrorResponse{
			Success: false,
			Message: "Failed to create article",
			Error:   err.Error(),
		})
		return
	}

	h.db.Preload("Author").First(&article, article.ID)

	c.JSON(http.StatusCreated, types.SuccessResponse{
		Success: true,
		Message: "Article created",
		Data:    article,
	})
}

// PUT /api/admin/articles/:id
func (h *ArticleHandler) UpdateArticle(c *gin.Context) {
	id := c.Param("id")

	var article models.Article
	if err := h.db.First(&article, id).Error; err != nil {
		c.JSON(http.StatusNotFound, types.ErrorResponse{
			Success: false,
			Message: "Article not found",
		})
		return
	}

	var req types.UpdateArticleRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, types.ErrorResponse{
			Success: false,
			Message: "Validation failed",
			Error:   err.Error(),
		})
		return
	}

	if req.Title != nil {
		article.Title = strings.TrimSpace(*req.Title)
	}
	if req.Excerpt != nil {
		article.Excerpt = strings.TrimSpace(*req.Excerpt)
	}
	if req.Content != nil {
		article.Content = *req.Content
	}
	if req.CoverImageURL != nil {
		if strings.TrimSpace(*req.CoverImageURL) == "" {
			c.JSON(http.StatusBadRequest, types.ErrorResponse{
				Success: false,
				Message: "Cover image is required",
			})
			return
		}
		article.CoverImageURL = strings.TrimSpace(*req.CoverImageURL)
	}
	if req.Category != nil {
		article.Category = models.ArticleCategory(*req.Category)
	}
	if req.Tags != nil {
		tagsJSON, err := json.Marshal(*req.Tags)
		if err != nil {
			c.JSON(http.StatusBadRequest, types.ErrorResponse{
				Success: false,
				Message: "Invalid tags",
				Error:   err.Error(),
			})
			return
		}
		article.Tags = string(tagsJSON)
	}
	if req.IsFeatured != nil {
		article.IsFeatured = *req.IsFeatured
	}
	if req.IsPublished != nil {
		if *req.IsPublished && !article.IsPublished && article.PublishedAt == nil {
			now := time.Now().UTC()
			article.PublishedAt = &now
		}
		article.IsPublished = *req.IsPublished
	}

	article.ReadTimeMinutes = utils.CalculateArticleReadTimeMinutes(article.Content)

	if err := h.db.Save(&article).Error; err != nil {
		c.JSON(http.StatusInternalServerError, types.ErrorResponse{
			Success: false,
			Message: "Failed to update article",
			Error:   err.Error(),
		})
		return
	}

	h.db.Preload("Author").First(&article, article.ID)

	c.JSON(http.StatusOK, types.SuccessResponse{
		Success: true,
		Message: "Article updated",
		Data:    article,
	})
}

// DELETE /api/admin/articles/:id
func (h *ArticleHandler) DeleteArticle(c *gin.Context) {
	id := c.Param("id")

	if err := h.db.Delete(&models.Article{}, id).Error; err != nil {
		c.JSON(http.StatusInternalServerError, types.ErrorResponse{
			Success: false,
			Message: "Failed to delete article",
			Error:   err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, types.SuccessResponse{
		Success: true,
		Message: "Article deleted",
	})
}

// PATCH /api/admin/articles/:id/publish
func (h *ArticleHandler) PublishArticle(c *gin.Context) {
	id := c.Param("id")

	var article models.Article
	if err := h.db.First(&article, id).Error; err != nil {
		c.JSON(http.StatusNotFound, types.ErrorResponse{
			Success: false,
			Message: "Article not found",
		})
		return
	}

	article.IsPublished = true
	if article.PublishedAt == nil {
		now := time.Now().UTC()
		article.PublishedAt = &now
	}

	if err := h.db.Save(&article).Error; err != nil {
		c.JSON(http.StatusInternalServerError, types.ErrorResponse{
			Success: false,
			Message: "Failed to publish article",
			Error:   err.Error(),
		})
		return
	}

	h.db.Preload("Author").First(&article, article.ID)

	c.JSON(http.StatusOK, types.SuccessResponse{
		Success: true,
		Message: "Article published",
		Data:    article,
	})
}

// PATCH /api/admin/articles/:id/unpublish
func (h *ArticleHandler) UnpublishArticle(c *gin.Context) {
	id := c.Param("id")

	var article models.Article
	if err := h.db.First(&article, id).Error; err != nil {
		c.JSON(http.StatusNotFound, types.ErrorResponse{
			Success: false,
			Message: "Article not found",
		})
		return
	}

	article.IsPublished = false
	if err := h.db.Save(&article).Error; err != nil {
		c.JSON(http.StatusInternalServerError, types.ErrorResponse{
			Success: false,
			Message: "Failed to unpublish article",
			Error:   err.Error(),
		})
		return
	}

	h.db.Preload("Author").First(&article, article.ID)

	c.JSON(http.StatusOK, types.SuccessResponse{
		Success: true,
		Message: "Article unpublished",
		Data:    article,
	})
}

// PATCH /api/admin/articles/:id/feature
func (h *ArticleHandler) ToggleFeatureArticle(c *gin.Context) {
	id := c.Param("id")

	var article models.Article
	if err := h.db.First(&article, id).Error; err != nil {
		c.JSON(http.StatusNotFound, types.ErrorResponse{
			Success: false,
			Message: "Article not found",
		})
		return
	}

	article.IsFeatured = !article.IsFeatured
	if err := h.db.Save(&article).Error; err != nil {
		c.JSON(http.StatusInternalServerError, types.ErrorResponse{
			Success: false,
			Message: "Failed to update article feature status",
			Error:   err.Error(),
		})
		return
	}

	h.db.Preload("Author").First(&article, article.ID)

	c.JSON(http.StatusOK, types.SuccessResponse{
		Success: true,
		Message: "Article feature status updated",
		Data:    article,
	})
}

func applyArticleFilters(c *gin.Context, query *gorm.DB, isAdmin bool) *gorm.DB {
	category := strings.TrimSpace(c.Query("category"))
	categories := parseCSV(c.Query("categories"))
	search := strings.TrimSpace(c.Query("search"))
	isFeatured := strings.TrimSpace(c.Query("is_featured"))
	tags := parseCSV(c.Query("tags"))

	if category != "" {
		if strings.Contains(category, ",") {
			categories = append(categories, parseCSV(category)...)
		} else {
			query = query.Where("category = ?", category)
		}
	}

	if len(categories) > 0 {
		query = query.Where("category IN ?", categories)
	}

	if isFeatured != "" {
		query = query.Where("is_featured = ?", isFeatured == "true")
	}

	if isAdmin {
		isPublished := strings.TrimSpace(c.Query("is_published"))
		if isPublished != "" {
			query = query.Where("is_published = ?", isPublished == "true")
		}
	}

	if search != "" {
		searchTerm := "%" + search + "%"
		query = query.Where("title ILIKE ? OR excerpt ILIKE ?", searchTerm, searchTerm)
	}

	for _, tag := range tags {
		searchTag := "%" + tag + "%"
		query = query.Where("tags ILIKE ?", searchTag)
	}

	return query
}

func applyPublicArticleSort(query *gorm.DB, sort string) *gorm.DB {
	if strings.EqualFold(sort, "popular") {
		return query.Order("views desc, published_at desc")
	}
	return query.Order("published_at desc, created_at desc")
}

func buildArticleListMeta(total int64, page, pageSize int) articleListMeta {
	pages := int(total) / pageSize
	if int(total)%pageSize != 0 {
		pages++
	}
	if pages == 0 {
		pages = 1
	}

	return articleListMeta{
		Total: total,
		Page:  page,
		Pages: pages,
	}
}

func getArticleUserID(c *gin.Context) (uuid.UUID, bool) {
	userIDValue, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, types.ErrorResponse{
			Success: false,
			Message: "Unauthorized",
		})
		return uuid.Nil, false
	}

	userIDString, ok := userIDValue.(string)
	if !ok {
		c.JSON(http.StatusUnauthorized, types.ErrorResponse{
			Success: false,
			Message: "Invalid user context",
		})
		return uuid.Nil, false
	}

	userID, err := uuid.Parse(userIDString)
	if err != nil {
		c.JSON(http.StatusUnauthorized, types.ErrorResponse{
			Success: false,
			Message: "Invalid user ID",
		})
		return uuid.Nil, false
	}

	return userID, true
}

func parseArticlePagination(c *gin.Context) (int, int) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	if page < 1 {
		page = 1
	}

	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "20"))
	if pageSize < 1 {
		pageSize = 20
	}
	if pageSize > 100 {
		pageSize = 100
	}

	return page, pageSize
}

func parseCSV(value string) []string {
	if strings.TrimSpace(value) == "" {
		return nil
	}

	parts := strings.Split(value, ",")
	result := make([]string, 0, len(parts))
	for _, part := range parts {
		trimmed := strings.TrimSpace(part)
		if trimmed != "" {
			result = append(result, trimmed)
		}
	}

	return result
}

func parseArticleCategories(raw string) []string {
	if strings.TrimSpace(raw) == "" {
		return []string{}
	}

	var categories []string
	if err := json.Unmarshal([]byte(raw), &categories); err != nil {
		return []string{}
	}

	return categories
}

func toFeedPreferenceResponse(preference models.UserFeedPreference) feedPreferenceResponse {
	return feedPreferenceResponse{
		ID:         preference.ID,
		UserID:     preference.UserID.String(),
		Categories: parseArticleCategories(preference.Categories),
		CreatedAt:  preference.CreatedAt,
		UpdatedAt:  preference.UpdatedAt,
	}
}
