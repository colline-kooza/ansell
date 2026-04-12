package routes

import (
	"ansell-backend-api/internal/config"
	"ansell-backend-api/internal/handlers"
	"ansell-backend-api/internal/middleware"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

func Setup(db *gorm.DB, cfg *config.Config) *gin.Engine {
	router := gin.Default()

	// Global CORS
	router.Use(middleware.CORS(cfg))

	// Handlers
	healthHandler := handlers.NewHealthHandler(db)
	authHandler := handlers.NewAuthHandler(db, cfg)
	userHandler := handlers.NewUserHandler(db)
	ownerAppHandler := handlers.NewOwnerApplicationHandler(db)
	companyHandler := handlers.NewCompanyHandler(db)
	propertyHandler := handlers.NewPropertyHandler(db)
	jobHandler := handlers.NewJobHandler(db)
	uploadHandler := handlers.NewUploadHandler(cfg)
	supplierHandler := handlers.NewSupplierHandler(db)
	tenderHandler := handlers.NewTenderHandler(db)
	videoAdvertHandler := handlers.NewVideoAdvertHandler(db)
	articleHandler := handlers.NewArticleHandler(db)
	feedHandler := handlers.NewFeedHandler(db)
	courseHandler := handlers.NewCourseHandler(db)
	enrollmentHandler := handlers.NewEnrollmentHandler(db)
	nationalIDHandler := handlers.NewNationalIDHandler(db)

	// Health check
	router.GET("/health", healthHandler.Health)

	// ─────────────────────────────────────
	// /api — new frontend routes
	// ─────────────────────────────────────
	api := router.Group("/api")
	{
		// ── Auth (public) ──────────────────
		auth := api.Group("/auth")
		{
			auth.POST("/register", authHandler.Register)
			auth.POST("/login", authHandler.Login)
			auth.GET("/me", middleware.AuthRequired(cfg), authHandler.Me)
		}

		// ── Public properties ──────────────
		api.GET("/properties", propertyHandler.ListPublicProperties)
		api.GET("/properties/:id", propertyHandler.GetPublicProperty)
		api.POST("/properties/:id/inquire", propertyHandler.SubmitInquiry)

		// ── Public Jobs & Companies ──────────────
		api.GET("/jobs", jobHandler.ListPublicJobs)
		api.GET("/jobs/:id", jobHandler.GetPublicJob)
		api.GET("/jobs/categories", jobHandler.GetCategories)
		api.POST("/jobs/:id/apply", jobHandler.ApplyToJob)

		api.GET("/companies", companyHandler.ListPublicCompanies)
		api.GET("/companies/:id", companyHandler.GetPublicCompany)

		// ── Public Tenders ─────────────────
		api.GET("/tenders", tenderHandler.ListPublicTenders)
		api.GET("/tenders/categories", tenderHandler.GetCategories)
		api.GET("/tenders/closing-soon", tenderHandler.GetClosingSoon)
		api.GET("/tenders/:id", tenderHandler.GetPublicTender)

		// ── Public Video Adverts ───────────
		api.GET("/video-adverts", videoAdvertHandler.List)
		api.GET("/video-adverts/categories", videoAdvertHandler.GetCategories)
		api.GET("/video-adverts/:id", videoAdvertHandler.Get)
		api.GET("/articles", articleHandler.ListPublicArticles)
		api.GET("/articles/featured", articleHandler.ListFeaturedArticles)
		api.GET("/articles/categories", articleHandler.GetArticleCategories)
		api.GET("/articles/related/:slug", articleHandler.GetRelatedArticles)
		api.GET("/articles/:slug", articleHandler.GetPublicArticle)
		api.GET("/feed", feedHandler.List)

		// ── Public Courses ─────────────────
		api.GET("/courses", courseHandler.List)
		api.GET("/courses/categories", courseHandler.GetCategories)
		api.GET("/courses/:id", courseHandler.Get)

		// ── File uploads (any authenticated user) ─
		upload := api.Group("/upload")
		upload.Use(middleware.AuthRequired(cfg))
		{
			upload.POST("/presign", uploadHandler.GetPresignedURL)
		}

		// ── Enrollment (authenticated users) ──
		enrollments := api.Group("/enrollments")
		enrollments.Use(middleware.AuthRequired(cfg))
		{
			enrollments.POST("", enrollmentHandler.Enroll)
			enrollments.GET("/my", enrollmentHandler.MyEnrollments)
			enrollments.GET("/check/:course_id", enrollmentHandler.CheckEnrolled)
		}

		// ── User routes ────────────────────
		userRoutes := api.Group("/user")
		userRoutes.Use(middleware.AuthRequired(cfg))
		{
			userRoutes.GET("/applications", jobHandler.ListUserApplications)
		}

		// ── Profile routes ──────────────────
		profile := api.Group("/profile")
		profile.Use(middleware.AuthRequired(cfg))
		{
			profile.GET("", userHandler.GetMe)
			profile.PATCH("", userHandler.UpdateMe)
			profile.POST("/change-password", userHandler.ChangePassword)
		}
		feedRoutes := api.Group("/feed")
		feedRoutes.Use(middleware.AuthRequired(cfg))
		{
			feedRoutes.GET("/preferences", articleHandler.GetFeedPreferences)
			feedRoutes.PUT("/preferences", articleHandler.UpdateFeedPreferences)
		}

		// ── Owner routes ───────────────────
		owner := api.Group("/owner")
		owner.Use(middleware.AuthRequired(cfg))
		{
			owner.POST("/apply", ownerAppHandler.Apply)

			// property_owner or super_admin
			ownerProps := owner.Group("")
			ownerProps.Use(middleware.RoleRequired("property_owner", "super_admin"))
			{
				ownerProps.GET("/properties", propertyHandler.ListOwnerProperties)
				ownerProps.POST("/properties", propertyHandler.CreateOwnerProperty)
				ownerProps.PUT("/properties/:id", propertyHandler.UpdateOwnerProperty)
				ownerProps.DELETE("/properties/:id", propertyHandler.DeleteOwnerProperty)
				ownerProps.GET("/inquiries", propertyHandler.ListOwnerInquiries)
				ownerProps.PATCH("/inquiries/:id/read", propertyHandler.MarkInquiryRead)
			}
		}

		// ── Company routes ─────────────────
		company := api.Group("/company")
		company.Use(middleware.AuthRequired(cfg))
		{
			company.POST("/apply", companyHandler.Apply)
		}

		// ── Supplier routes ────────────────
		supplier := api.Group("/supplier")
		supplier.Use(middleware.AuthRequired(cfg))
		{
			supplier.POST("/apply", supplierHandler.Apply)

			supplierAuth := supplier.Group("")
			supplierAuth.Use(middleware.RoleRequired("supplier", "super_admin"))
			{
				supplierAuth.GET("/profile", supplierHandler.GetProfile)
				supplierAuth.PUT("/profile", supplierHandler.UpdateProfile)
				supplierAuth.GET("/bids", tenderHandler.ListSupplierBids)
			}
		}

		// ── Tender Bidding ─────────────────
		api.POST("/tenders/:id/bid", middleware.AuthRequired(cfg), middleware.RoleRequired("supplier"), tenderHandler.SubmitBid)

		// ── Company Owner routes ───────────
		companyOwner := api.Group("/company-owner")
		companyOwner.Use(middleware.AuthRequired(cfg))
		companyOwner.Use(middleware.RoleRequired("company_owner", "super_admin"))
		{
			companyOwner.GET("/company", companyHandler.GetOwnerCompany)
			companyOwner.PUT("/company", companyHandler.UpdateOwnerCompany)
			companyOwner.GET("/jobs", jobHandler.ListOwnerJobs)
			companyOwner.POST("/jobs", jobHandler.CreateOwnerJob)
			companyOwner.PUT("/jobs/:id", jobHandler.UpdateOwnerJob)
			companyOwner.DELETE("/jobs/:id", jobHandler.DeleteOwnerJob)
			companyOwner.GET("/applications", jobHandler.ListOwnerApplications)
			companyOwner.PATCH("/applications/:id/status", jobHandler.UpdateApplicationStatus)
		}

		// ── Admin routes ───────────────────
		admin := api.Group("/admin")
		admin.Use(middleware.AuthRequired(cfg))
		admin.Use(middleware.AdminRequired())
		{
			// Owner applications
			admin.GET("/owner-applications", ownerAppHandler.ListApplications)
			admin.GET("/owner-applications/:id", ownerAppHandler.GetApplication)
			admin.PATCH("/owner-applications/:id/approve", ownerAppHandler.ApproveApplication)
			admin.PATCH("/owner-applications/:id/reject", ownerAppHandler.RejectApplication)

			// Company applications
			admin.GET("/company-applications", companyHandler.ListApplications)
			admin.GET("/company-applications/:id", companyHandler.GetApplication)
			admin.PATCH("/company-applications/:id/approve", companyHandler.ApproveApplication)
			admin.PATCH("/company-applications/:id/reject", companyHandler.RejectApplication)
			admin.GET("/companies", companyHandler.ListAdminCompanies)
			admin.PATCH("/companies/:id/verify", companyHandler.VerifyCompany)

			// Jobs (admin CRUD)
			admin.GET("/jobs", jobHandler.AdminListJobs)
			admin.POST("/jobs", jobHandler.AdminCreateJob)
			admin.PUT("/jobs/:id", jobHandler.UpdateOwnerJob)    // reuse update logic
			admin.DELETE("/jobs/:id", jobHandler.DeleteOwnerJob) // reuse delete logic
			admin.PATCH("/jobs/:id/approve", jobHandler.AdminApproveJob)
			admin.PATCH("/jobs/:id/reject", jobHandler.AdminRejectJob)
			admin.PATCH("/jobs/:id/feature", jobHandler.AdminFeatureJob)

			// Job Applications (admin)
			admin.GET("/applications", jobHandler.AdminListApplications)
			admin.PATCH("/applications/:id/status", jobHandler.AdminUpdateApplicationStatus)

			// Properties (admin CRUD)
			admin.GET("/properties", propertyHandler.AdminListProperties)
			admin.POST("/properties", propertyHandler.AdminCreateProperty)
			admin.PUT("/properties/:id", propertyHandler.AdminUpdateProperty)
			admin.DELETE("/properties/:id", propertyHandler.AdminDeleteProperty)
			admin.PATCH("/properties/:id/approve", propertyHandler.AdminApproveProperty)
			admin.PATCH("/properties/:id/reject", propertyHandler.AdminRejectProperty)
			admin.PATCH("/properties/:id/feature", propertyHandler.AdminFeatureProperty)

			// Supplier applications
			admin.GET("/supplier-applications", supplierHandler.ListApplications)
			admin.GET("/supplier-applications/:id", supplierHandler.GetApplication)
			admin.PATCH("/supplier-applications/:id/approve", supplierHandler.ApproveApplication)
			admin.PATCH("/supplier-applications/:id/reject", supplierHandler.RejectApplication)
			admin.GET("/suppliers", supplierHandler.ListAdminSuppliers)
			admin.PATCH("/suppliers/:id/verify", supplierHandler.VerifySupplier)

			// Tenders (admin)
			admin.GET("/tenders", tenderHandler.ListAdminTenders)
			admin.POST("/tenders", tenderHandler.CreateTender)
			admin.PUT("/tenders/:id", tenderHandler.UpdateTender)
			admin.DELETE("/tenders/:id", tenderHandler.DeleteTender)
			admin.PATCH("/tenders/:id/approve", tenderHandler.ApproveTender)
			admin.PATCH("/tenders/:id/reject", tenderHandler.RejectTender)
			admin.PATCH("/tenders/:id/feature", tenderHandler.FeatureTender)
			admin.PATCH("/tenders/:id/close", tenderHandler.CloseTender)
			admin.PATCH("/tenders/:id/award", tenderHandler.AwardTender)

			// Bids (admin)
			admin.GET("/bids", tenderHandler.ListAdminBids)
			admin.GET("/bids/:id", tenderHandler.GetAdminBid)
			admin.PATCH("/bids/:id/status", tenderHandler.UpdateBidStatus)

			// Video Adverts (admin)
			admin.GET("/video-adverts", videoAdvertHandler.List)
			admin.GET("/video-adverts/:id", videoAdvertHandler.Get)
			admin.POST("/video-adverts", videoAdvertHandler.Create)
			admin.PUT("/video-adverts/:id", videoAdvertHandler.Update)
			admin.DELETE("/video-adverts/:id", videoAdvertHandler.Delete)
			admin.PATCH("/video-adverts/:id/feature", videoAdvertHandler.ToggleFeature)
			admin.PATCH("/video-adverts/:id/toggle-active", videoAdvertHandler.ToggleActive)
			admin.GET("/articles", articleHandler.ListAdminArticles)
			admin.GET("/articles/:id", articleHandler.GetAdminArticle)
			admin.POST("/articles", articleHandler.CreateArticle)
			admin.PUT("/articles/:id", articleHandler.UpdateArticle)
			admin.DELETE("/articles/:id", articleHandler.DeleteArticle)
			admin.PATCH("/articles/:id/publish", articleHandler.PublishArticle)
			admin.PATCH("/articles/:id/unpublish", articleHandler.UnpublishArticle)
			admin.PATCH("/articles/:id/feature", articleHandler.ToggleFeatureArticle)

			// Courses (admin)
			admin.GET("/courses", courseHandler.List)
			admin.GET("/courses/:id", courseHandler.Get)
			admin.POST("/courses", courseHandler.Create)
			admin.PUT("/courses/:id", courseHandler.Update)
			admin.DELETE("/courses/:id", courseHandler.Delete)
			admin.PATCH("/courses/:id/feature", courseHandler.ToggleFeature)
			admin.PATCH("/courses/:id/toggle-active", courseHandler.ToggleActive)
			admin.PATCH("/courses/:id/publish", courseHandler.Publish)
			admin.PATCH("/courses/:id/unpublish", courseHandler.Unpublish)

			// Enrollments (admin)
			admin.GET("/enrollments", enrollmentHandler.AdminList)
			admin.GET("/enrollments/stats", enrollmentHandler.AdminStats)
			admin.PATCH("/enrollments/:id/status", enrollmentHandler.AdminUpdateStatus)
			admin.DELETE("/enrollments/:id", enrollmentHandler.AdminDelete)

			// Users (admin)
			admin.GET("/users", userHandler.GetAllUsers)
			admin.GET("/users/:id", userHandler.GetUserByID)
			admin.DELETE("/users/:id", userHandler.DeleteUser)
			admin.PATCH("/users/:id/suspend", userHandler.SuspendUser)
			admin.PATCH("/users/:id/role", userHandler.UpdateUserRole)

			// National ID (admin)
			admin.GET("/national-id/applications", nationalIDHandler.AdminListApplications)
			admin.GET("/national-id/applications/:id", nationalIDHandler.AdminGetApplication)
			admin.PATCH("/national-id/applications/:id/status", nationalIDHandler.AdminUpdateStatus)
			admin.PATCH("/national-id/applications/:id/assign-id-number", nationalIDHandler.AdminAssignIDNumber)
			admin.DELETE("/national-id/applications/:id", nationalIDHandler.AdminDeleteApplication)
			admin.GET("/national-id/stats", nationalIDHandler.AdminGetStats)
		}

		// ── National ID (authenticated users) ──────────────────────────────
		nationalID := api.Group("/national-id")
		nationalID.Use(middleware.AuthRequired(cfg))
		{
			nationalID.POST("/apply", nationalIDHandler.SubmitApplication)
			nationalID.GET("/my-application", nationalIDHandler.GetMyApplication)
			nationalID.GET("/my-applications", nationalIDHandler.GetMyApplications)
			nationalID.PATCH("/my-application/additional-document", nationalIDHandler.UploadAdditionalDocument)
		}
	}

	// ─────────────────────────────────────
	// /api/v1 — legacy routes (backward compat)
	// ─────────────────────────────────────
	v1 := router.Group("/api/v1")
	{
		authV1 := v1.Group("/auth")
		{
			authV1.POST("/register", authHandler.Register)
			authV1.POST("/login", authHandler.Login)
		}

		users := v1.Group("/users")
		users.Use(middleware.AuthRequired(cfg))
		{
			users.GET("/me", userHandler.GetMe)
			users.PATCH("/me", userHandler.UpdateMe)
			users.POST("/me/change-password", userHandler.ChangePassword)

			adminGroup := users.Group("")
			adminGroup.Use(middleware.AdminRequired())
			{
				adminGroup.GET("", userHandler.GetAllUsers)
				adminGroup.GET("/:id", userHandler.GetUserByID)
				adminGroup.DELETE("/:id", userHandler.DeleteUser)
			}
		}
	}

	return router
}
