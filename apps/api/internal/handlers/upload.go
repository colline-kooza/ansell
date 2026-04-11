package handlers

import (
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"net/http"
	"strings"
	"time"

	"ansell-backend-api/internal/config"
	"ansell-backend-api/internal/types"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type UploadHandler struct {
	cfg *config.Config
}

func NewUploadHandler(cfg *config.Config) *UploadHandler {
	return &UploadHandler{cfg: cfg}
}

type PresignRequest struct {
	Filename    string `json:"filename" binding:"required"`
	ContentType string `json:"content_type" binding:"required"`
	FileSize    int64  `json:"file_size"`
}

var allowedMimeTypes = map[string]bool{
	"image/jpeg":       true,
	"image/png":        true,
	"image/webp":       true,
	"image/gif":        true,
	"application/pdf":  true,
	"video/mp4":        true,
	"video/webm":       true,
	"video/quicktime":  true,
}

const maxFileSizeImage = 50 * 1024 * 1024 // 50MB
const maxFileSizeVideo = 500 * 1024 * 1024 // 500MB

// POST /api/upload/presign
func (h *UploadHandler) GetPresignedURL(c *gin.Context) {
	var req PresignRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, types.ErrorResponse{
			Success: false,
			Message: "Validation failed",
			Error:   err.Error(),
		})
		return
	}

	if !allowedMimeTypes[req.ContentType] {
		c.JSON(http.StatusBadRequest, types.ErrorResponse{
			Success: false,
			Message: "File type not allowed. Allowed types: JPEG, PNG, WebP, GIF, PDF, MP4, WebM, QuickTime",
		})
		return
	}

	maxAllowedSize := maxFileSizeImage
	if strings.HasPrefix(req.ContentType, "video/") {
		maxAllowedSize = maxFileSizeVideo
	}

	if req.FileSize > int64(maxAllowedSize) {
		c.JSON(http.StatusBadRequest, types.ErrorResponse{
			Success: false,
			Message: fmt.Sprintf("File size exceeds %dMB limit", maxAllowedSize/(1024*1024)),
		})
		return
	}

	// Generate a unique key for the file
	ext := extensionFromMime(req.ContentType)
	key := fmt.Sprintf("uploads/%s/%s%s", time.Now().Format("2006/01/02"), uuid.New().String(), ext)

	// Generate presigned URL using AWS Signature v4
	presignedURL, err := h.generatePresignedPutURL(key, req.ContentType)
	if err != nil {
		c.JSON(http.StatusInternalServerError, types.ErrorResponse{
			Success: false,
			Message: "Failed to generate upload URL",
		})
		return
	}

	// Public URL that will be accessible after upload
	publicURL := fmt.Sprintf("%s/%s", strings.TrimRight(h.cfg.R2PublicURL, "/"), key)
	if h.cfg.R2PublicURL == "" {
		// Fallback: construct from endpoint and bucket
		publicURL = fmt.Sprintf("%s/%s/%s", strings.TrimRight(h.cfg.R2Endpoint, "/"), h.cfg.R2BucketName, key)
	}

	c.JSON(http.StatusOK, types.SuccessResponse{
		Success: true,
		Message: "Presigned URL generated",
		Data: gin.H{
			"upload_url": presignedURL,
			"public_url": publicURL,
			"key":        key,
		},
	})
}

// generatePresignedPutURL generates an AWS Signature V4 presigned PUT URL for Cloudflare R2.
func (h *UploadHandler) generatePresignedPutURL(key, contentType string) (string, error) {
	if h.cfg.R2Endpoint == "" || h.cfg.R2AccessKeyID == "" {
		return "", fmt.Errorf("R2 not configured")
	}

	now := time.Now().UTC()
	dateShort := now.Format("20060102")
	dateLong := now.Format("20060102T150405Z")
	expiry := 3600 // 1 hour

	// Parse endpoint to get host
	endpoint := strings.TrimRight(h.cfg.R2Endpoint, "/")
	host := strings.TrimPrefix(strings.TrimPrefix(endpoint, "https://"), "http://")

	region := "auto"
	service := "s3"

	credentialScope := fmt.Sprintf("%s/%s/%s/aws4_request", dateShort, region, service)
	credential := fmt.Sprintf("%s/%s", h.cfg.R2AccessKeyID, credentialScope)

	queryParams := fmt.Sprintf(
		"X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=%s&X-Amz-Date=%s&X-Amz-Expires=%d&X-Amz-SignedHeaders=content-type%%3Bhost",
		strings.ReplaceAll(credential, "/", "%2F"),
		dateLong,
		expiry,
	)

	canonicalURI := fmt.Sprintf("/%s/%s", h.cfg.R2BucketName, key)
	canonicalHeaders := fmt.Sprintf("content-type:%s\nhost:%s\n", contentType, host)
	signedHeaders := "content-type;host"

	canonicalRequest := strings.Join([]string{
		"PUT",
		canonicalURI,
		queryParams,
		canonicalHeaders,
		signedHeaders,
		"UNSIGNED-PAYLOAD",
	}, "\n")

	stringToSign := strings.Join([]string{
		"AWS4-HMAC-SHA256",
		dateLong,
		credentialScope,
		hashSHA256(canonicalRequest),
	}, "\n")

	signingKey := deriveSigningKey(h.cfg.R2SecretAccessKey, dateShort, region, service)
	signature := hex.EncodeToString(hmacSHA256(signingKey, stringToSign))

	presignedURL := fmt.Sprintf("%s%s?%s&X-Amz-Signature=%s",
		endpoint, canonicalURI, queryParams, signature)

	return presignedURL, nil
}

func hmacSHA256(key []byte, data string) []byte {
	mac := hmac.New(sha256.New, key)
	mac.Write([]byte(data))
	return mac.Sum(nil)
}

func hashSHA256(data string) string {
	h := sha256.Sum256([]byte(data))
	return hex.EncodeToString(h[:])
}

func deriveSigningKey(secret, date, region, service string) []byte {
	kDate := hmacSHA256([]byte("AWS4"+secret), date)
	kRegion := hmacSHA256(kDate, region)
	kService := hmacSHA256(kRegion, service)
	kSigning := hmacSHA256(kService, "aws4_request")
	return kSigning
}

func extensionFromMime(mime string) string {
	switch mime {
	case "image/jpeg":
		return ".jpg"
	case "image/png":
		return ".png"
	case "image/webp":
		return ".webp"
	case "image/gif":
		return ".gif"
	case "application/pdf":
		return ".pdf"
	case "video/mp4":
		return ".mp4"
	case "video/webm":
		return ".webm"
	case "video/quicktime":
		return ".mov"
	default:
		return ""
	}
}
