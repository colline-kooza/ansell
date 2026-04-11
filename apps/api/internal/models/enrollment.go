package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type EnrollmentPaymentStatus string

const (
	EnrollmentStatusFree    EnrollmentPaymentStatus = "free"
	EnrollmentStatusPending EnrollmentPaymentStatus = "pending"
	EnrollmentStatusPaid    EnrollmentPaymentStatus = "paid"
)

type Enrollment struct {
	ID        uint           `gorm:"primaryKey" json:"id"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`

	UserID   uuid.UUID `gorm:"type:uuid;not null;index" json:"user_id"`
	User     User      `gorm:"foreignKey:UserID" json:"user"`
	CourseID uint      `gorm:"not null;index" json:"course_id"`
	Course   Course    `gorm:"foreignKey:CourseID" json:"course"`

	PaymentStatus  EnrollmentPaymentStatus `gorm:"type:varchar(20);default:'pending';index" json:"payment_status"`
	AmountPaid     *float64                `json:"amount_paid"`
	Currency       string                  `gorm:"type:varchar(10);default:'USD'" json:"currency"`
	TransactionRef string                  `json:"transaction_ref"`

	EnrolledAt *time.Time `json:"enrolled_at"`
}
