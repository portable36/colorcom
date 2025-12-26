# Convenience Makefile for local dev

.PHONY: up down logs frontend dev clean

up:
	docker-compose -f docker-compose.dev.yml up --build

down:
	docker-compose -f docker-compose.dev.yml down --volumes

logs:
	docker-compose -f docker-compose.dev.yml logs -f

frontend:
	cd microservices/web-frontend && npm run dev

clean:
	docker system prune --volumes -f
