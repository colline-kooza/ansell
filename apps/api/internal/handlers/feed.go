package handlers

import (
	"encoding/json"
	"fmt"
	"net/http"
	"sort"
	"strconv"
	"strings"
	"sync"
	"time"

	"ansell-backend-api/internal/models"
	"ansell-backend-api/internal/types"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type FeedHandler struct {
	db *gorm.DB
}

type UnifiedFeedItem struct {
	ID            string    `json:"id"`
	Type          string    `json:"type"`
	Title         string    `json:"title"`
	Excerpt       string    `json:"excerpt"`
	Category      string    `json:"category"`
	CategoryLabel string    `json:"category_label"`
	SourceName    string    `json:"source_name"`
	City          *string   `json:"city"`
	Price         *string   `json:"price"`
	ThumbnailURL  *string   `json:"thumbnail_url"`
	IsFeatured    bool      `json:"is_featured"`
	IsVerified    *bool     `json:"is_verified"`
	Views         int       `json:"views"`
	BadgeLabel    *string   `json:"badge_label"`
	SlugOrID      string    `json:"slug_or_id"`
	CreatedAt     time.Time `json:"created_at"`
}

type unifiedFeedResponse struct {
	Success bool              `json:"success"`
	Message string            `json:"message"`
	Data    []UnifiedFeedItem `json:"data"`
	Meta    articleListMeta   `json:"meta"`
}

var (
	propertyCategoryLabels = map[string]string{
		string(models.CategoryRental):          "Rental",
		string(models.CategoryLandForSale):     "Land for Sale",
		string(models.CategoryLease):           "Lease",
		string(models.CategoryApartment):       "Apartment",
		string(models.CategoryCommercialSpace): "Commercial Space",
	}
	videoAdvertCategoryLabels = map[string]string{
		string(models.CategoryRealEstatePromos):   "Real Estate Promos",
		string(models.CategoryCorporateCampaigns): "Corporate Campaigns",
		string(models.CategoryProductLaunches):    "Product Launches",
		string(models.CategoryServiceSpotlights):  "Service Spotlights",
		string(models.CategorySponsoredContent):   "Sponsored Content",
	}
)

func NewFeedHandler(db *gorm.DB) *FeedHandler {
	return &FeedHandler{db: db}
}

// GET /api/feed
func (h *FeedHandler) List(c *gin.Context) {
	page, pageSize := parseArticlePagination(c)
	moduleFilters := parseCSV(c.Query("categories"))
	articleCategoryFilters := parseCSV(c.Query("article_categories"))
	selectedModules := normalizeFeedModules(moduleFilters)
	perModuleLimit := 50

	var (
		wg    sync.WaitGroup
		mutex sync.Mutex
		items []UnifiedFeedItem
		errCh = make(chan error, len(selectedModules))
	)

	appendItems := func(batch []UnifiedFeedItem) {
		mutex.Lock()
		items = append(items, batch...)
		mutex.Unlock()
	}

	for _, module := range selectedModules {
		wg.Add(1)
		go func(module string) {
			defer wg.Done()

			var (
				batch []UnifiedFeedItem
				err   error
			)

			switch module {
			case "real_estate":
				batch, err = h.fetchPropertyFeedItems(perModuleLimit)
			case "jobs":
				batch, err = h.fetchJobFeedItems(perModuleLimit)
			case "tenders":
				batch, err = h.fetchTenderFeedItems(perModuleLimit)
			case "articles":
				batch, err = h.fetchArticleFeedItems(perModuleLimit, articleCategoryFilters)
			case "video_adverts":
				batch, err = h.fetchVideoAdvertFeedItems(perModuleLimit)
			}

			if err != nil {
				errCh <- err
				return
			}

			appendItems(batch)
		}(module)
	}

	wg.Wait()
	close(errCh)

	for err := range errCh {
		if err != nil {
			c.JSON(http.StatusInternalServerError, types.ErrorResponse{
				Success: false,
				Message: "Failed to build feed",
				Error:   err.Error(),
			})
			return
		}
	}

	sort.Slice(items, func(i, j int) bool {
		return items[i].CreatedAt.After(items[j].CreatedAt)
	})

	total := int64(len(items))
	meta := buildArticleListMeta(total, page, pageSize)
	start := (page - 1) * pageSize
	if start > len(items) {
		start = len(items)
	}
	end := start + pageSize
	if end > len(items) {
		end = len(items)
	}

	c.JSON(http.StatusOK, unifiedFeedResponse{
		Success: true,
		Message: "Feed fetched",
		Data:    items[start:end],
		Meta:    meta,
	})
}

func (h *FeedHandler) fetchPropertyFeedItems(limit int) ([]UnifiedFeedItem, error) {
	var properties []models.Property
	if err := h.db.Where("status = ? AND is_active = ?", models.PropertyActive, true).
		Preload("Owner", func(db *gorm.DB) *gorm.DB {
			return db.Select("id", "first_name", "last_name")
		}).
		Order("created_at desc").
		Limit(limit).
		Find(&properties).Error; err != nil {
		return nil, err
	}

	items := make([]UnifiedFeedItem, 0, len(properties))
	for _, property := range properties {
		sourceName := strings.TrimSpace(property.Owner.FirstName + " " + property.Owner.LastName)
		if sourceName == "" {
			sourceName = "ANASELL"
		}

		items = append(items, UnifiedFeedItem{
			ID:            fmt.Sprintf("property-%s", property.ID.String()),
			Type:          "real_estate",
			Title:         property.Title,
			Excerpt:       truncateText(property.Description, 150),
			Category:      string(property.Category),
			CategoryLabel: propertyCategoryLabels[string(property.Category)],
			SourceName:    sourceName,
			City:          nullableString(property.City),
			Price:         nullableString(formatPropertyFeedPrice(property)),
			ThumbnailURL:  nullableString(firstJSONString(property.Images)),
			IsFeatured:    property.IsFeatured,
			IsVerified:    nil,
			Views:         property.Views,
			BadgeLabel:    feedBadge(property.IsFeatured, "Featured"),
			SlugOrID:      property.ID.String(),
			CreatedAt:     property.CreatedAt,
		})
	}

	return items, nil
}

func (h *FeedHandler) fetchJobFeedItems(limit int) ([]UnifiedFeedItem, error) {
	var jobs []models.Job
	if err := h.db.Where("status = ? AND is_active = ?", "active", true).
		Preload("Company", func(db *gorm.DB) *gorm.DB {
			return db.Select("id", "company_name", "logo_url", "is_verified")
		}).
		Order("created_at desc").
		Limit(limit).
		Find(&jobs).Error; err != nil {
		return nil, err
	}

	items := make([]UnifiedFeedItem, 0, len(jobs))
	for _, job := range jobs {
		sourceName := "ANASELL"
		var thumbnailURL *string
		var isVerified *bool
		if job.Company != nil {
			sourceName = job.Company.CompanyName
			thumbnailURL = nullableString(job.Company.LogoURL)
			isVerified = &job.Company.IsVerified
		}

		items = append(items, UnifiedFeedItem{
			ID:            fmt.Sprintf("job-%s", job.ID.String()),
			Type:          "job",
			Title:         job.Title,
			Excerpt:       truncateText(job.Description, 150),
			Category:      job.Category,
			CategoryLabel: humanizeKey(job.Category),
			SourceName:    sourceName,
			City:          nullableString(job.City),
			Price:         nullableString(formatJobFeedPrice(job)),
			ThumbnailURL:  thumbnailURL,
			IsFeatured:    job.IsFeatured,
			IsVerified:    isVerified,
			Views:         job.Views,
			BadgeLabel:    feedBadge(job.IsFeatured, job.JobType),
			SlugOrID:      job.ID.String(),
			CreatedAt:     job.CreatedAt,
		})
	}

	return items, nil
}

func (h *FeedHandler) fetchTenderFeedItems(limit int) ([]UnifiedFeedItem, error) {
	var tenders []models.Tender
	if err := h.db.Where("status = ? AND is_active = ?", "active", true).
		Order("created_at desc").
		Limit(limit).
		Find(&tenders).Error; err != nil {
		return nil, err
	}

	items := make([]UnifiedFeedItem, 0, len(tenders))
	for _, tender := range tenders {
		items = append(items, UnifiedFeedItem{
			ID:            fmt.Sprintf("tender-%s", tender.ID.String()),
			Type:          "tender",
			Title:         tender.Title,
			Excerpt:       truncateText(tender.Description, 150),
			Category:      tender.Category,
			CategoryLabel: humanizeKey(tender.Category),
			SourceName:    tender.IssuingOrganisation,
			City:          nullableString(tender.City),
			Price:         nullableString(formatSimpleCurrency(tender.ValueEstimate, tender.ValueCurrency)),
			ThumbnailURL:  nullableString(tender.IssuingOrganisationLogo),
			IsFeatured:    tender.IsFeatured,
			IsVerified:    nil,
			Views:         tender.Views,
			BadgeLabel:    buildTenderBadge(tender),
			SlugOrID:      tender.ID.String(),
			CreatedAt:     tender.CreatedAt,
		})
	}

	return items, nil
}

func (h *FeedHandler) fetchArticleFeedItems(limit int, categories []string) ([]UnifiedFeedItem, error) {
	query := h.db.Where("is_published = ?", true).
		Preload("Author", func(db *gorm.DB) *gorm.DB {
			return db.Select("id", "first_name", "last_name")
		}).
		Order("created_at desc").
		Limit(limit)

	if len(categories) > 0 {
		query = query.Where("category IN ?", categories)
	}

	var articles []models.Article
	if err := query.Find(&articles).Error; err != nil {
		return nil, err
	}

	items := make([]UnifiedFeedItem, 0, len(articles))
	for _, article := range articles {
		sourceName := strings.TrimSpace(article.Author.FirstName + " " + article.Author.LastName)
		if sourceName == "" {
			sourceName = "ANASELL"
		}

		items = append(items, UnifiedFeedItem{
			ID:            fmt.Sprintf("article-%d", article.ID),
			Type:          "article",
			Title:         article.Title,
			Excerpt:       truncateText(article.Excerpt, 150),
			Category:      string(article.Category),
			CategoryLabel: articleCategoryLabels[string(article.Category)],
			SourceName:    sourceName,
			City:          nil,
			Price:         nil,
			ThumbnailURL:  nullableString(article.CoverImageURL),
			IsFeatured:    article.IsFeatured,
			IsVerified:    nil,
			Views:         article.Views,
			BadgeLabel:    feedBadge(article.IsFeatured, "Featured"),
			SlugOrID:      article.Slug,
			CreatedAt:     article.CreatedAt,
		})
	}

	return items, nil
}

func (h *FeedHandler) fetchVideoAdvertFeedItems(limit int) ([]UnifiedFeedItem, error) {
	var adverts []models.VideoAdvert
	if err := h.db.Where("is_active = ?", true).
		Order("created_at desc").
		Limit(limit).
		Find(&adverts).Error; err != nil {
		return nil, err
	}

	items := make([]UnifiedFeedItem, 0, len(adverts))
	for _, advert := range adverts {
		sourceName := advert.Sponsor
		if strings.TrimSpace(sourceName) == "" {
			sourceName = "ANASELL"
		}

		items = append(items, UnifiedFeedItem{
			ID:            fmt.Sprintf("video-advert-%d", advert.ID),
			Type:          "video_advert",
			Title:         advert.Title,
			Excerpt:       truncateText(advert.Description, 150),
			Category:      string(advert.Category),
			CategoryLabel: videoAdvertCategoryLabels[string(advert.Category)],
			SourceName:    sourceName,
			City:          nil,
			Price:         nil,
			ThumbnailURL:  nullableString(advert.ThumbnailURL),
			IsFeatured:    advert.IsFeatured,
			IsVerified:    nil,
			Views:         advert.Views,
			BadgeLabel:    feedBadge(advert.IsFeatured, "Featured"),
			SlugOrID:      strconv.FormatUint(uint64(advert.ID), 10),
			CreatedAt:     advert.CreatedAt,
		})
	}

	return items, nil
}

func normalizeFeedModules(modules []string) []string {
	if len(modules) == 0 {
		return []string{"real_estate", "jobs", "tenders", "articles", "video_adverts"}
	}

	allowed := map[string]bool{
		"real_estate":   true,
		"jobs":          true,
		"tenders":       true,
		"articles":      true,
		"video_adverts": true,
	}

	normalized := make([]string, 0, len(modules))
	seen := make(map[string]bool, len(modules))
	for _, module := range modules {
		module = strings.TrimSpace(module)
		if allowed[module] && !seen[module] {
			normalized = append(normalized, module)
			seen[module] = true
		}
	}

	if len(normalized) == 0 {
		return []string{"real_estate", "jobs", "tenders", "articles", "video_adverts"}
	}

	return normalized
}

func truncateText(value string, limit int) string {
	value = strings.TrimSpace(value)
	if len(value) <= limit {
		return value
	}
	return strings.TrimSpace(value[:limit]) + "..."
}

func humanizeKey(value string) string {
	value = strings.ReplaceAll(value, "_", " ")
	value = strings.ReplaceAll(value, "-", " ")
	parts := strings.Fields(strings.ToLower(value))
	for index, part := range parts {
		if len(part) == 0 {
			continue
		}
		parts[index] = strings.ToUpper(part[:1]) + part[1:]
	}
	return strings.Join(parts, " ")
}

func firstJSONString(value string) string {
	if strings.TrimSpace(value) == "" {
		return ""
	}

	var items []string
	if err := json.Unmarshal([]byte(value), &items); err != nil {
		return ""
	}
	if len(items) == 0 {
		return ""
	}
	return items[0]
}

func nullableString(value string) *string {
	if strings.TrimSpace(value) == "" {
		return nil
	}
	trimmed := strings.TrimSpace(value)
	return &trimmed
}

func formatSimpleCurrency(amount *float64, currency string) string {
	if amount == nil {
		return ""
	}
	code := strings.TrimSpace(currency)
	if code == "" {
		code = "USD"
	}
	return fmt.Sprintf("%s %.0f", code, *amount)
}

func formatPropertyFeedPrice(property models.Property) string {
	if property.Price == 0 {
		return ""
	}

	price := fmt.Sprintf("%s %.0f", defaultCurrency(property.Currency), property.Price)
	switch property.PricePeriod {
	case "per_month":
		return price + " / mo"
	case "per_year":
		return price + " / yr"
	default:
		return price
	}
}

func formatJobFeedPrice(job models.Job) string {
	min := job.SalaryMin
	max := job.SalaryMax
	currency := defaultCurrency(job.SalaryCurrency)

	switch {
	case min != nil && max != nil:
		return fmt.Sprintf("%s %.0f - %.0f", currency, *min, *max)
	case min != nil:
		return fmt.Sprintf("%s %.0f+", currency, *min)
	case max != nil:
		return fmt.Sprintf("Up to %s %.0f", currency, *max)
	default:
		return ""
	}
}

func defaultCurrency(currency string) string {
	if strings.TrimSpace(currency) == "" {
		return "USD"
	}
	return currency
}

func feedBadge(isFeatured bool, fallback string) *string {
	if isFeatured {
		label := "Featured"
		return &label
	}
	if strings.TrimSpace(fallback) == "" {
		return nil
	}
	label := fallback
	return &label
}

func buildTenderBadge(tender models.Tender) *string {
	if strings.TrimSpace(tender.AttachmentURL) != "" {
		label := "PDF Attached"
		return &label
	}
	if tender.SubmissionDeadline != nil {
		now := time.Now()
		if tender.SubmissionDeadline.After(now) && tender.SubmissionDeadline.Sub(now) <= 7*24*time.Hour {
			label := "Closing Soon"
			return &label
		}
	}
	if tender.IsFeatured {
		label := "Featured"
		return &label
	}
	return nil
}
