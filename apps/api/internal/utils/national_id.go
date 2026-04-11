package utils

import (
	"fmt"
	"math/rand"
	"time"

	"ansell-backend-api/internal/models"
	"gorm.io/gorm"
)

// GenerateNationalIDReferenceNumber creates a unique "NID-YYYY-XXXXXX" reference.
// Checks DB uniqueness and retries up to 5 times on collision.
func GenerateNationalIDReferenceNumber(db *gorm.DB) (string, error) {
	year := time.Now().Year()
	rng := rand.New(rand.NewSource(time.Now().UnixNano()))

	for attempts := 0; attempts < 5; attempts++ {
		seq := rng.Intn(999999) + 1
		ref := fmt.Sprintf("NID-%d-%06d", year, seq)

		var count int64
		db.Model(&models.NationalIDApplication{}).
			Where("reference_number = ?", ref).
			Count(&count)

		if count == 0 {
			return ref, nil
		}
	}

	return "", fmt.Errorf("failed to generate unique reference number after 5 attempts")
}

// NIDAllowedTransitions defines valid next statuses for each current status.
// "rejected" is always available from any non-terminal status — added in handler.
var NIDAllowedTransitions = map[models.NationalIDStatus][]models.NationalIDStatus{
	models.NIDStatusSubmitted:         {models.NIDStatusUnderReview, models.NIDStatusRejected},
	models.NIDStatusUnderReview:       {models.NIDStatusDocumentsRequired, models.NIDStatusDocumentsVerified, models.NIDStatusRejected},
	models.NIDStatusDocumentsRequired: {models.NIDStatusUnderReview, models.NIDStatusRejected},
	models.NIDStatusDocumentsVerified: {models.NIDStatusProcessing, models.NIDStatusRejected},
	models.NIDStatusProcessing:        {models.NIDStatusReadyForPickup, models.NIDStatusRejected},
	models.NIDStatusReadyForPickup:    {models.NIDStatusCollected},
	models.NIDStatusCollected:         {},
	models.NIDStatusRejected:          {},
}

// IsNIDTransitionAllowed checks whether transitioning from current → next is valid.
func IsNIDTransitionAllowed(current, next models.NationalIDStatus) bool {
	allowed, ok := NIDAllowedTransitions[current]
	if !ok {
		return false
	}
	for _, s := range allowed {
		if s == next {
			return true
		}
	}
	return false
}

// IsNIDTerminalStatus returns true if the status is a final state (no transitions out).
func IsNIDTerminalStatus(status models.NationalIDStatus) bool {
	return status == models.NIDStatusCollected || status == models.NIDStatusRejected
}

// IsNIDActiveStatus returns true if the application blocks a new submission.
func IsNIDActiveStatus(status models.NationalIDStatus) bool {
	return !IsNIDTerminalStatus(status)
}
