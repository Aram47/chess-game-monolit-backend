#!/bin/bash

# Script to wait for all services to be ready
# Usage: ./scripts/wait-for-services.sh [timeout] [--skip-server]

set -e

# Parse arguments
SKIP_SERVER=false
TIMEOUT=120

for arg in "$@"; do
    case $arg in
        --skip-server)
            SKIP_SERVER=true
            shift
            ;;
        *)
            if [[ "$arg" =~ ^[0-9]+$ ]]; then
                TIMEOUT=$arg
            fi
            shift
            ;;
    esac
done

ELAPSED=0
INTERVAL=2

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Waiting for services to be ready (timeout: ${TIMEOUT}s)...${NC}"

# Function to check if a service is ready
check_service() {
    local service_name=$1
    local check_command=$2
    
    if eval "$check_command" > /dev/null 2>&1; then
        return 0
    else
        return 1
    fi
}

# Wait for PostgreSQL
wait_for_postgres() {
    echo -n "Waiting for PostgreSQL..."
    while [ $ELAPSED -lt $TIMEOUT ]; do
        if docker exec postgres pg_isready -U "${POSTGRES_USER:-postgres}" -d "${POSTGRES_DB:-postgres}" > /dev/null 2>&1; then
            echo -e " ${GREEN}✓${NC}"
            return 0
        fi
        sleep $INTERVAL
        ELAPSED=$((ELAPSED + INTERVAL))
        echo -n "."
    done
    echo -e " ${RED}✗${NC}"
    echo -e "${RED}PostgreSQL failed to become ready within ${TIMEOUT}s${NC}"
    return 1
}

# Wait for MongoDB
wait_for_mongo() {
    echo -n "Waiting for MongoDB..."
    ELAPSED=0
    while [ $ELAPSED -lt $TIMEOUT ]; do
        # Try mongosh first (newer versions), fallback to mongo (older versions)
        if docker exec mongo mongosh --eval "db.adminCommand('ping')" --quiet > /dev/null 2>&1 || \
           docker exec mongo mongo --eval "db.adminCommand('ping')" --quiet > /dev/null 2>&1; then
            echo -e " ${GREEN}✓${NC}"
            return 0
        fi
        sleep $INTERVAL
        ELAPSED=$((ELAPSED + INTERVAL))
        echo -n "."
    done
    echo -e " ${RED}✗${NC}"
    echo -e "${RED}MongoDB failed to become ready within ${TIMEOUT}s${NC}"
    return 1
}

# Wait for Redis
wait_for_redis() {
    echo -n "Waiting for Redis..."
    ELAPSED=0
    while [ $ELAPSED -lt $TIMEOUT ]; do
        if docker exec redis redis-cli ping > /dev/null 2>&1; then
            echo -e " ${GREEN}✓${NC}"
            return 0
        fi
        sleep $INTERVAL
        ELAPSED=$((ELAPSED + INTERVAL))
        echo -n "."
    done
    echo -e " ${RED}✗${NC}"
    echo -e "${RED}Redis failed to become ready within ${TIMEOUT}s${NC}"
    return 1
}

# Wait for Chess Server (optional, checks if container is running)
wait_for_chess_server() {
    # Only check if container exists, don't wait for HTTP endpoint
    # This is much faster and sufficient for test runs
    if docker ps | grep -q chess-server; then
        echo -e "Chess Server container is running ${GREEN}✓${NC}"
        return 0
    else
        echo -e "Chess Server container not found ${YELLOW}⚠${NC} (optional for tests)"
        return 0  # Don't fail if container doesn't exist
    fi
}

# Check if docker-compose services are running
if ! docker ps | grep -q postgres; then
    echo -e "${RED}Error: PostgreSQL container is not running${NC}"
    exit 1
fi

if ! docker ps | grep -q mongo; then
    echo -e "${RED}Error: MongoDB container is not running${NC}"
    exit 1
fi

if ! docker ps | grep -q redis; then
    echo -e "${RED}Error: Redis container is not running${NC}"
    exit 1
fi

# Wait for all services
wait_for_postgres
wait_for_mongo
wait_for_redis

# Only check chess server if not skipped
if [ "$SKIP_SERVER" = false ]; then
    wait_for_chess_server
fi

echo -e "${GREEN}All required services are ready!${NC}"
exit 0
