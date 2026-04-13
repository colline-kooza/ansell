package main

import (
	"fmt"
	"log"
	"time"

	"ansell-backend-api/internal/config"
	"ansell-backend-api/internal/database"
	"ansell-backend-api/internal/models"

	"github.com/google/uuid"
	"github.com/joho/godotenv"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

func main() {
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found, using system environment variables")
	}

	cfg := config.Load()
	db := database.Connect(cfg)
	database.Migrate(db)

	// 1. Create Super Admin
	admin := seedUser(db, "Super", "Admin", "admin@ansell.com", "Admin@1234", models.RoleSuperAdmin)
	fmt.Println("✅ Super admin settled.")

	// 2. Seed Companies (Focus on South Sudan: NGOs, Private Sector)
	companies := seedCompanies(db, admin.ID)
	fmt.Println("✅ Companies seeded.")

	// 3. Seed Properties (4 per category = 20 total)
	seedProperties(db, admin.ID)
	fmt.Println("✅ Properties seeded.")

	// 4. Seed Articles
	seedArticles(db, admin.ID)
	fmt.Println("✅ Articles seeded.")

	// 5. Seed Tenders
	seedTenders(db, admin.ID, companies)
	fmt.Println("✅ Tenders seeded.")

	// 6. Seed Video Adverts
	seedVideoAdverts(db, admin.ID)
	fmt.Println("✅ Video Adverts seeded.")

	// 7. Seed Courses
	seedCourses(db, admin.ID)
	fmt.Println("✅ Courses seeded.")

	fmt.Println("\n🚀 Seeding completed successfully for all modules!")
}

func seedUser(db *gorm.DB, first, last, email, pass string, role models.UserRole) models.User {
	var user models.User
	hashed, _ := bcrypt.GenerateFromPassword([]byte(pass), bcrypt.DefaultCost)

	if err := db.Where("email = ?", email).First(&user).Error; err == nil {
		// Reset password and role for existing admin
		db.Model(&user).Updates(map[string]interface{}{
			"password":  string(hashed),
			"role":      role,
			"is_active": true,
		})
		return user
	}

	user = models.User{
		FirstName: first,
		LastName:  last,
		Email:     email,
		Password:  string(hashed),
		Role:      role,
		Provider:  models.ProviderLocal,
		IsActive:  true,
	}
	db.Create(&user)
	return user
}

func seedCompanies(db *gorm.DB, adminID uuid.UUID) []models.Company {
	data := []struct {
		Name string
		Type string
		Ind  string
		Logo string
		City string
	}{
		{"UNMISS South Sudan", "IGO", "Humanitarian", "https://images.unsplash.com/photo-1593113598332-cd288d649433?auto=format&fit=crop&q=80&w=400", "Juba"},
		{"Save the Children SSD", "NGO", "NGO", "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?auto=format&fit=crop&q=80&w=400", "Juba"},
		{"Nile Petroleum Corporation", "Parastatal", "Oil & Gas", "https://images.unsplash.com/photo-1541888941297-dc5977a64169?auto=format&fit=crop&q=80&w=400", "Juba"},
		{"Zain South Sudan", "Private", "Telecom", "https://images.unsplash.com/photo-1516321497487-e288fb19713f?auto=format&fit=crop&q=80&w=400", "Juba"},
		{"ICRC South Sudan", "NGO", "Humanitarian", "https://images.unsplash.com/photo-1532629345422-7515f3d16bb6?auto=format&fit=crop&q=80&w=400", "Wau"},
		{"World Vision South Sudan", "NGO", "Humanitarian", "https://images.unsplash.com/photo-1454165833767-027eeef15582?auto=format&fit=crop&q=80&w=400", "Malakal"},
		{"South Sudan Commercial Bank", "Private", "Banking", "https://images.unsplash.com/photo-1501167786227-4cba60f6d58f?auto=format&fit=crop&q=80&w=400", "Juba"},
	}

	var companies []models.Company
	for _, d := range data {
		var existing models.Company
		if err := db.Where("company_name = ?", d.Name).First(&existing).Error; err != nil {
			c := models.Company{
				OwnerID:     adminID,
				CompanyName: d.Name,
				CompanyType: d.Type,
				Industry:    d.Ind,
				LogoURL:     d.Logo,
				City:        d.City,
				Description: fmt.Sprintf("%s is a leading organization operating in South Sudan focused on %s.", d.Name, d.Ind),
				IsVerified:  true,
				IsActive:    true,
				Slug:        fmt.Sprintf("%s-ssd", uuid.New().String()[:8]),
			}
			db.Create(&c)
			companies = append(companies, c)
		} else {
			companies = append(companies, existing)
		}
	}
	return companies
}

func seedProperties(db *gorm.DB, adminID uuid.UUID) {
	categories := []models.PropertyCategory{
		models.CategoryRental,
		models.CategoryLandForSale,
		models.CategoryLease,
		models.CategoryApartment,
		models.CategoryCommercialSpace,
	}

	images := []string{
		"https://images.unsplash.com/photo-1580538328901-ec8940bb6013?auto=format&fit=crop&q=80&w=800",
		"https://images.unsplash.com/photo-1493333030-ad2700c3302b?auto=format&fit=crop&q=80&w=800",
		"https://images.unsplash.com/photo-1500382017468-9049fee8f66e?auto=format&fit=crop&q=80&w=800",
		"https://images.unsplash.com/photo-1497366216401-215024b0b98f?auto=format&fit=crop&q=80&w=800",
	}

	cities := []string{"Juba", "Wau", "Yei", "Bor"}

	for _, cat := range categories {
		for i := 1; i <= 4; i++ {
			title := fmt.Sprintf("Premium %s in %s %d", cat, cities[i-1], i)
			var existing models.Property
			if err := db.Where("title = ?", title).First(&existing).Error; err != nil {
				bedrooms := 3
				bathrooms := 2
				size := 150.0
				price := 1200.0 * float64(i)
				if cat == models.CategoryLandForSale {
					price = 50000.0 * float64(i)
				}
				p := models.Property{
					OwnerID:     adminID,
					Title:       title,
					Description: "Beautiful and secure property located in the heart of South Sudan. Features modern amenities and 24/7 security guarding.",
					Category:    cat,
					Price:       price,
					PricePeriod: "per_month",
					Currency:    "USD",
					City:        cities[i-1],
					Location:    "Residential Area",
					Address:     "Plot " + fmt.Sprintf("%d", i*10) + ", High Street",
					Bedrooms:    &bedrooms,
					Bathrooms:   &bathrooms,
					SizeM2:      &size,
					Amenities:   `["24/7 Power", "Running Water", "Security", "Parking"]`,
					Images:      fmt.Sprintf(`["%s"]`, images[i-1]),
					IsFeatured:  i == 1,
					IsActive:    true,
					Status:      models.PropertyActive,
				}
				db.Create(&p)
			}
		}
	}
}

func seedArticles(db *gorm.DB, adminID uuid.UUID) {
	articles := []struct {
		Title string
		Cat   models.ArticleCategory
		Img   string
	}{
		{"Economic Growth in Juba 2026", models.ArticleCategoryEconomy, "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80&w=800"},
		{"Healthcare Challenges in Rural Wau", models.ArticleCategoryHealth, "https://images.unsplash.com/photo-1584515933487-779824d29309?auto=format&fit=crop&q=80&w=800"},
		{"Tech Boom: Startups of South Sudan", models.ArticleCategoryTechnology, "https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&q=80&w=800"},
		{"Agricultural Potential of the Nile Valley", models.ArticleCategoryAgriculture, "https://images.unsplash.com/photo-1500382017468-9049fee8f66e?auto=format&fit=crop&q=80&w=800"},
		{"Infrastructure: Building the New Highway", models.ArticleCategoryInfrastructure, "https://images.unsplash.com/photo-1486406146906-e3d3c360bbf2?auto=format&fit=crop&q=80&w=800"},
	}

	for _, a := range articles {
		var existing models.Article
		if err := db.Where("title = ?", a.Title).First(&existing).Error; err != nil {
			pubAt := time.Now()
			art := models.Article{
				AuthorID:      adminID,
				Title:         a.Title,
				Slug:          fmt.Sprintf("%s-%s", a.Cat, uuid.New().String()[:5]),
				Excerpt:       "Discover the latest trends and updates regarding this sector in South Sudan.",
				Content:       "This is a comprehensive article about the detailed developments in South Sudan. We explore the historical context, current challenges, and the promising future ahead.",
				CoverImageURL: a.Img,
				Category:      a.Cat,
				IsFeatured:    true,
				IsPublished:   true,
				PublishedAt:   &pubAt,
			}
			db.Create(&art)
		}
	}
}

func seedTenders(db *gorm.DB, adminID uuid.UUID, companies []models.Company) {
	if len(companies) == 0 {
		return
	}
	tenders := []string{"Supply of Food Items", "Construction of Warehouse", "IT Infrastructure Upgrade"}
	for i, title := range tenders {
		var existing models.Tender
		if err := db.Where("title = ?", title).First(&existing).Error; err != nil {
			deadline := time.Now().AddDate(0, 1, 0)
			openDate := time.Now().AddDate(0, 0, -5)
			t := models.Tender{
				PostedByID:              adminID,
				CompanyID:               &companies[i%len(companies)].ID,
				IssuingOrganisation:     companies[i%len(companies)].CompanyName,
				IssuingOrganisationLogo: companies[i%len(companies)].LogoURL,
				Title:                   title,
				ReferenceNumber:         "REF/SSD/" + fmt.Sprintf("%d", 2026+i),
				Description:             "We are seeking a reliable partner for this project. Interested parties must submit their bids before the deadline.",
				Category:                "Supply & Services",
				TenderType:              "Open",
				City:                    "Juba",
				Location:                "Organisation HQ",
				SubmissionDeadline:      &deadline,
				TenderOpenDate:          &openDate,
				IsActive:                true,
				Status:                  "active",
			}
			db.Create(&t)
		}
	}
}

func seedVideoAdverts(db *gorm.DB, adminID uuid.UUID) {
	adverts := []struct {
		Title string
		Img   string
	}{
		{"Discover Modern Juba Living", "https://images.unsplash.com/photo-1486406146906-e3d3c360bbf2?auto=format&fit=crop&q=80&w=800"},
		{"Nile Petroleum: Powering Growth", "https://images.unsplash.com/photo-1541888941297-dc5977a64169?auto=format&fit=crop&q=80&w=800"},
		{"Zain 5G Experience South Sudan", "https://images.unsplash.com/photo-1516321497487-e288fb19713f?auto=format&fit=crop&q=80&w=800"},
		{"UNICEF: Support Children in SSD", "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?auto=format&fit=crop&q=80&w=800"},
		{"Premium Real Estate Showcase", "https://images.unsplash.com/photo-1580538328901-ec8940bb6013?auto=format&fit=crop&q=80&w=800"},
	}

	for _, v := range adverts {
		var existing models.VideoAdvert
		if err := db.Where("title = ?", v.Title).First(&existing).Error; err != nil {
			dur := 60
			adv := models.VideoAdvert{
				CreatedByID:  adminID,
				Title:        v.Title,
				Description:  "Experience the future of South Sudan through our high-quality video campaign.",
				Sponsor:      v.Title,
				Category:     models.CategoryCorporateCampaigns,
				VideoURL:     "https://www.w3schools.com/html/mov_bbb.mp4", // Placeholder video
				ThumbnailURL: v.Img,
				Duration:     &dur,
				IsActive:     true,
				IsFeatured:   true,
			}
			db.Create(&adv)
		}
	}
}

func seedCourses(db *gorm.DB, adminID uuid.UUID) {
	courses := []struct {
		Title string
		Cat   models.CourseCategory
		Img   string
	}{
		{"Intro to Digital Literacy Juba", models.CourseCategoryTelecomICT, "https://images.unsplash.com/photo-1516321497487-e288fb19713f?auto=format&fit=crop&q=80&w=800"},
		{"Agribusiness Management Basics", models.CourseCategoryAgricultureAgribusiness, "https://images.unsplash.com/photo-1500382017468-9049fee8f66e?auto=format&fit=crop&q=80&w=800"},
		{"Public Health Management", models.CourseCategoryHealthcareMedical, "https://images.unsplash.com/photo-1584515933487-779824d29309?auto=format&fit=crop&q=80&w=800"},
	}

	for _, c := range courses {
		var existing models.Course
		if err := db.Where("title = ?", c.Title).First(&existing).Error; err != nil {
			start := time.Now().AddDate(0, 2, 0)
			end := time.Now().AddDate(0, 3, 0)
			course := models.Course{
				CreatedByID:  adminID,
				Title:        c.Title,
				Description:  "Learn essential skills to thrive in the modern South Sudanese workforce.",
				Provider:     "Ansell Training Center",
				Category:     c.Cat,
				Level:        "Beginner",
				Price:        50.0,
				Currency:     "USD",
				ThumbnailURL: c.Img,
				Duration:     "8 Weeks",
				Mode:         models.CourseModeHybrid,
				City:         "Juba",
				StartDate:    &start,
				EndDate:      &end,
				Status:       models.CourseStatusActive,
				IsActive:     true,
				IsFeatured:   true,
			}
			db.Create(&course)
		}
	}
}
