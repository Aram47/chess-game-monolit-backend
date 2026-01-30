# Scripts Documentation

This directory contains utility scripts for managing the development environment and running tests with Docker Compose.

## Scripts

### `wait-for-services.sh`

Waits for all Docker services (PostgreSQL, MongoDB, Redis, and Chess Server) to be ready before proceeding.

**Usage:**
```bash
./scripts/wait-for-services.sh [timeout] [--skip-server]
```

**Parameters:**
- `timeout` (optional): Maximum time to wait in seconds (default: 120)
- `--skip-server` (optional): Skip checking the chess server (useful for test runs)

**Examples:**
```bash
# Wait with default timeout
./scripts/wait-for-services.sh

# Wait with custom timeout
./scripts/wait-for-services.sh 60

# Skip chess server check (faster for tests)
./scripts/wait-for-services.sh --skip-server
```

### `run-tests.sh`

Runs tests after ensuring all services are ready.

**Usage:**
```bash
./scripts/run-tests.sh [test-type]
```

**Parameters:**
- `test-type` (optional): Type of tests to run
  - `unit` - Run unit tests only
  - `int` - Run integration tests only
  - `e2e` - Run e2e tests only
  - `all` - Run all tests (default)

**Example:**
```bash
./scripts/run-tests.sh e2e
```

### `setup-and-test.sh`

Complete setup and test script that:
1. Starts docker-compose services
2. Waits for all services to be ready
3. Runs tests

**Usage:**
```bash
./scripts/setup-and-test.sh [test-type] [--no-build]
```

**Parameters:**
- `test-type` (optional): Type of tests to run (default: `all`)
- `--no-build`: Skip building Docker images

**Examples:**
```bash
# Run all tests with build
./scripts/setup-and-test.sh

# Run only e2e tests without rebuilding
./scripts/setup-and-test.sh e2e --no-build
```

## Using Makefile

For convenience, you can use the Makefile commands:

```bash
# Start services and wait for them
make setup

# Run all tests
make test

# Run specific test types
make test-unit
make test-int
make test-e2e

# Complete setup and test
make setup-and-test

# View logs
make logs

# Stop services
make down

# Clean everything (including volumes)
make clean
```

## Using NPM Scripts

You can also use npm scripts:

```bash
# Start docker-compose
npm run docker:up

# Wait for services
npm run docker:wait

# Run tests
npm run docker:test

# Complete setup and test
npm run docker:setup

# View logs
npm run docker:logs

# Stop services
npm run docker:down
```

## Workflow Examples

### Development Workflow

1. Start services:
   ```bash
   docker-compose up -d
   # or
   make up
   # or
   npm run docker:up
   ```

2. Wait for services to be ready:
   ```bash
   ./scripts/wait-for-services.sh
   # or
   make wait
   # or
   npm run docker:wait
   ```

3. Run tests:
   ```bash
   ./scripts/run-tests.sh e2e
   # or
   make test-e2e
   # or
   npm run docker:test e2e
   ```

### Complete Test Run

Run everything in one command:
```bash
./scripts/setup-and-test.sh
# or
make setup-and-test
# or
npm run docker:setup
```

## Notes

- All scripts check if Docker containers are running before attempting to connect
- Scripts use colored output for better readability
- Timeouts can be adjusted based on your system's performance
- The scripts are designed to work with the docker-compose.yml configuration
