# ─── Build stage ──────────────────────────────────────────────────────────────
FROM golang:1.25-alpine AS builder

RUN apk add --no-cache git ca-certificates

WORKDIR /app

COPY go.mod go.sum ./
RUN go mod download

COPY . .

# Build the main server binary
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-w -s" -o /app/server ./cmd/main.go

# Build the seed binary
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-w -s" -o /app/seed ./cmd/seed/main.go

# ─── Production stage ─────────────────────────────────────────────────────────
FROM alpine:3.19 AS production

RUN apk --no-cache add ca-certificates tzdata

WORKDIR /app

# Copy both binaries from builder
COPY --from=builder /app/server .
COPY --from=builder /app/seed .

RUN adduser -D -u 10001 appuser
USER appuser

EXPOSE 8080

CMD ["./server"]