FROM golang:1.26-alpine as builder

WORKDIR /app

COPY go.mod go.sum ./

RUN go mod download
COPY . .


RUN CGO_ENABLED=0 GOOS=linux go build -o /server ./backend/cmd/server

# Stage-2 RUNNN

FROM alpine:3.20

RUN apk add --no-cache ca-certificates
WORKDIR /app

COPY --from=builder /server .

EXPOSE 8080
ENTRYPOINT [ "./server" ]