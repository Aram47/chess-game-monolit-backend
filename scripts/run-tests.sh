#!/bin/bash

# Script to run tests after services are up
# Usage: ./scripts/run-tests.sh [test-type]
# test-type: unit, int, e2e, or all (default: all)

set -e

TEST_TYPE=${1:-all}
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

cd "$PROJECT_DIR"

echo -e "${BLUE}Running tests: ${TEST_TYPE}${NC}"

# Wait for services first (skip chess server check for faster test runs)
echo -e "${YELLOW}Waiting for services to be ready...${NC}"
"$SCRIPT_DIR/wait-for-services.sh" --skip-server || {
    echo -e "${RED}Services are not ready. Please start them with: docker-compose up -d${NC}"
    exit 1
}

# Run tests based on type
case $TEST_TYPE in
    unit)
        echo -e "${BLUE}Running unit tests...${NC}"
        npm run test:unit
        ;;
    int)
        echo -e "${BLUE}Running integration tests...${NC}"
        npm run test:int
        ;;
    e2e)
        echo -e "${BLUE}Running e2e tests...${NC}"
        npm run test:e2e
        ;;
    all)
        echo -e "${BLUE}Running all tests...${NC}"
        echo -e "${YELLOW}Running unit tests...${NC}"
        npm run test:unit || echo -e "${YELLOW}Unit tests completed with some failures${NC}"
        echo -e "${YELLOW}Running integration tests...${NC}"
        npm run test:int || echo -e "${YELLOW}Integration tests completed with some failures${NC}"
        echo -e "${YELLOW}Running e2e tests...${NC}"
        npm run test:e2e || echo -e "${YELLOW}E2E tests completed with some failures${NC}"
        ;;
    *)
        echo -e "${RED}Invalid test type: ${TEST_TYPE}${NC}"
        echo "Usage: $0 [unit|int|e2e|all]"
        exit 1
        ;;
esac

echo -e "${GREEN}Tests completed!${NC}"
