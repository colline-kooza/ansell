package models

import (
	"time"

	"github.com/google/uuid"
)

type UserFeedPreference struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`

	UserID uuid.UUID `gorm:"type:uuid;not null;uniqueIndex;index" json:"user_id"`
	User   User      `gorm:"foreignKey:UserID" json:"user"`

	Categories string `gorm:"type:text" json:"categories"`
}
