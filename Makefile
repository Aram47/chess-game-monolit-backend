.PHONY: help up down restart logs test test-unit test-int test-e2e wait clean setup

# Default target
help:
	@echo "Chess Game Backend - Makefile Commands"
	@echo ""
	@echo "Setup & Management:"
	@echo "  make setup          - Start services and wait for them to be ready"
	@echo "  make up             - Start docker-compose services"
	@echo "  make down           - Stop docker-compose services"
	@echo "  make restart        - Restart docker-compose services"
	@echo "  make logs           - Show docker-compose logs"
	@echo "  make clean          - Stop services and remove volumes"
	@echo ""
	@echo "Testing:"
	@echo "  make test           - Run all tests (unit, integration, e2e)"
	@echo "  make test-unit      - Run unit tests only"
	@echo "  make test-int       - Run integration tests only"
	@echo "  make test-e2e       - Run e2e tests only"
	@echo ""
	@echo "Utilities:"
	@echo "  make wait           - Wait for all services to be ready"
	@echo "  make setup-and-test - Start services, wait, and run all tests"

# Setup services
setup:
	@echo "Starting services..."
	docker-compose up -d
	@echo "Waiting for services to be ready..."
	@./scripts/wait-for-services.sh

# Docker compose commands
up:
	docker-compose up -d

up-build:
	docker-compose up -d --build

down:
	docker-compose down

restart:
	docker-compose restart

logs:
	docker-compose logs -f

clean:
	docker-compose down -v
	@echo "Cleaned up all volumes"

# Wait for services
wait:
	@./scripts/wait-for-services.sh

# Test commands
test: wait
	@./scripts/run-tests.sh all

test-unit: wait
	@./scripts/run-tests.sh unit

test-int: wait
	@./scripts/run-tests.sh int

test-e2e: wait
	@./scripts/run-tests.sh e2e

# Complete setup and test
setup-and-test:
	@./scripts/setup-and-test.sh all
