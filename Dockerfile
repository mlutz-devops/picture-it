FROM golang:tip-alpine

WORKDIR /app

COPY go.mod go.sum ./

RUN go mod download

COPY . .

RUN CGO_ENABLED=0 GOOS=linux go build -o /tmp/server ./cmd/server

ENV CONFIG_PATH=/app/config.yaml


EXPOSE 8080

CMD ["/tmp/server"]
