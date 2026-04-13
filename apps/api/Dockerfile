# ─── Build stage ──────────────────────────────────────────────────────────────
FROM golang:1.25-alpine AS builder

# Install necessary build tools
RUN apk add --no-cache git ca-certificates

WORKDIR /app

# Copy dependency files first for caching
COPY go.mod go.sum ./
RUN go mod download

# Copy source code
COPY . .

# Build the binary
# Disable CGO for a statically linked binary
# -ldflags="-w -s" reduces binary size by removing debug info
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-w -s" -o /app/server ./cmd/main.go

# ─── Production stage ─────────────────────────────────────────────────────────
FROM alpine:3.19 AS production

# Add runtime dependencies
RUN apk --no-cache add ca-certificates tzdata

WORKDIR /app

# Copy binary from builder
COPY --from=builder /app/server .

# Run as non-privileged user for security
RUN adduser -D -u 10001 appuser
USER appuser

EXPOSE 8080

CMD ["./server"]
