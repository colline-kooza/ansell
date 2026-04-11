package handlers

import (
	"net/http"
	"time"

	"ansell-backend-api/internal/config"
	"ansell-backend-api/internal/middleware"
	"ansell-backend-api/internal/models"
	"ansell-backend-api/internal/types"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

type AuthHandler struct {
	db  *gorm.DB
	cfg *config.Config
}

func NewAuthHandler(db *gorm.DB, cfg *config.Config) *AuthHandler {
	return &AuthHandler{db: db, cfg: cfg}
}

func (h *AuthHandler) generateToken(user *models.User) (string, error) {
	claims := &middleware.Claims{
		UserID: user.ID.String(),
		Email:  user.Email,
		Role:   string(user.Role),
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(7 * 24 * time.Hour)), // 7 days
			IssuedAt:  jwt.NewNumericDate(time.Now()),
		},
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(h.cfg.JWTSecret))
}

// safeUser returns user without sensitive fields.
func safeUser(u *models.User) gin.H {
	return gin.H{
		"id":               u.ID,
		"first_name":       u.FirstName,
		"last_name":        u.LastName,
		"email":            u.Email,
		"phone":            u.Phone,
		"avatar":           u.Avatar,
		"role":             u.Role,
		"is_active":        u.IsActive,
		"is_email_verified": u.IsEmailVerified,
		"provider":         u.Provider,
		"created_at":       u.CreatedAt,
		"updated_at":       u.UpdatedAt,
	}
}

// POST /api/auth/register
func (h *AuthHandler) Register(c *gin.Context) {
	var req types.RegisterRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, types.ErrorResponse{
			Success: false,
			Message: "Validation failed",
			Error:   err.Error(),
		})
		return
	}

	var existing models.User
	if err := h.db.Where("email = ?", req.Email).First(&existing).Error; err == nil {
		c.JSON(http.StatusConflict, types.ErrorResponse{
			Success: false,
			Message: "An account with that email already exists",
		})
		return
	}

	hashed, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		c.JSON(http.StatusInternalServerError, types.ErrorResponse{
			Success: false,
			Message: "Failed to process password",
		})
		return
	}

	user := models.User{
		FirstName: req.FirstName,
		LastName:  req.LastName,
		Email:     req.Email,
		Password:  string(hashed),
		Phone:     req.Phone,
		Provider:  models.ProviderLocal,
		Role:      models.RoleUser,
		IsActive:  true,
	}

	if err := h.db.Create(&user).Error; err != nil {
		c.JSON(http.StatusInternalServerError, types.ErrorResponse{
			Success: false,
			Message: "Failed to create account",
		})
		return
	}

	token, err := h.generateToken(&user)
	if err != nil {
		c.JSON(http.StatusInternalServerError, types.ErrorResponse{
			Success: false,
			Message: "Failed to generate token",
		})
		return
	}

	c.JSON(http.StatusCreated, types.SuccessResponse{
		Success: true,
		Message: "Account created successfully",
		Data: types.AuthResponse{
			Token: token,
			User:  safeUser(&user),
		},
	})
}

// POST /api/auth/login
func (h *AuthHandler) Login(c *gin.Context) {
	var req types.LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, types.ErrorResponse{
			Success: false,
			Message: "Validation failed",
			Error:   err.Error(),
		})
		return
	}

	var user models.User
	if err := h.db.Where("email = ?", req.Email).First(&user).Error; err != nil {
		c.JSON(http.StatusUnauthorized, types.ErrorResponse{
			Success: false,
			Message: "Invalid email or password",
		})
		return
	}

	if !user.IsActive {
		c.JSON(http.StatusForbidden, types.ErrorResponse{
			Success: false,
			Message: "Your account has been suspended. Please contact support.",
		})
		return
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(req.Password)); err != nil {
		c.JSON(http.StatusUnauthorized, types.ErrorResponse{
			Success: false,
			Message: "Invalid email or password",
		})
		return
	}

	token, err := h.generateToken(&user)
	if err != nil {
		c.JSON(http.StatusInternalServerError, types.ErrorResponse{
			Success: false,
			Message: "Failed to generate token",
		})
		return
	}

	c.JSON(http.StatusOK, types.SuccessResponse{
		Success: true,
		Message: "Signed in successfully",
		Data: types.AuthResponse{
			Token: token,
			User:  safeUser(&user),
		},
	})
}

// GET /api/auth/me
func (h *AuthHandler) Me(c *gin.Context) {
	userIDStr, _ := c.Get("user_id")
	userID, err := uuid.Parse(userIDStr.(string))
	if err != nil {
		c.JSON(http.StatusUnauthorized, types.ErrorResponse{
			Success: false,
			Message: "Invalid token",
		})
		return
	}

	var user models.User
	if err := h.db.Where("id = ? AND is_active = true", userID).First(&user).Error; err != nil {
		c.JSON(http.StatusUnauthorized, types.ErrorResponse{
			Success: false,
			Message: "User not found or account suspended",
		})
		return
	}

	c.JSON(http.StatusOK, types.SuccessResponse{
		Success: true,
		Message: "User fetched",
		Data:    gin.H{"user": safeUser(&user)},
	})
}
