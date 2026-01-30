#!/bin/bash

# Complete setup and test script
# This script:
# 1. Starts docker-compose services
# 2. Waits for all services to be ready
# 3. Runs tests
# Usage: ./scripts/setup-and-test.sh [test-type] [--no-build]

set -e

TEST_TYPE=${1:-all}
NO_BUILD=false

# Parse arguments
for arg in "$@"; do
    case $arg in
        --no-build)
            NO_BUILD=true
            shift
            ;;
    esac
done

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

cd "$PROJECT_DIR"

echo -e "${BLUE}=== Chess Game Setup and Test ===${NC}"

# Start docker-compose
echo -e "${YELLOW}Starting docker-compose services...${NC}"
if [ "$NO_BUILD" = true ]; then
    docker-compose up -d
else
    docker-compose up -d --build
fi

# Wait for services
echo -e "${YELLOW}Waiting for services to be ready...${NC}"
"$SCRIPT_DIR/wait-for-services.sh" || {
    echo -e "${RED}Failed to start services${NC}"
    docker-compose logs
    exit 1
}

# Run tests
echo -e "${YELLOW}Running tests...${NC}"
"$SCRIPT_DIR/run-tests.sh" "$TEST_TYPE"

echo -e "${GREEN}=== Setup and tests completed successfully! ===${NC}"
