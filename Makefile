.PHONY: all build test clean \
	build-ts build-go test-ts test-go clean-ts clean-go reset

# Default: build and test both implementations.
all: build test

build: build-ts build-go

test: test-ts test-go

clean: clean-ts clean-go

# --- TypeScript (canonical implementation, package lives in ts/) ---

build-ts:
	cd ts && npm run build

test-ts:
	cd ts && npm test

clean-ts:
	rm -rf ts/dist ts/dist-test

# --- Go port (go/) ---

build-go:
	cd go && go build ./...

test-go:
	cd go && go vet ./... && go test ./...

clean-go:
	cd go && go clean

# Full reset: reinstall TS deps, rebuild, and run both suites.
reset:
	cd ts && npm run reset
	cd go && go clean -cache
	cd go && go test ./...
