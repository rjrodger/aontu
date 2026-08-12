.PHONY: all build test clean build-ts build-go test-ts test-go clean-ts clean-go publish-go tags-go reset cov cov-ts cov-go

all: build test

build: build-ts build-go

test: test-ts test-go

clean: clean-ts clean-go

# Test coverage (see docs/test-coverage.md)
cov: cov-ts cov-go

cov-ts:
	cd ts && npm run test-cov
	cd ts && npm run test-cov-check

# Unit-test statement coverage, plus GOCOVERDIR integration runs of the
# two command binaries so their literal main() functions are counted —
# go test cannot execute a main() that os.Exits. The two profiles are
# unioned by scripts/covmerge.
cov-go:
	cd go && go test -cover -coverprofile=coverage-unit.out $$(go list ./... | grep -v /scripts/)
	cd go && rm -rf covdata && mkdir -p covdata bin \
		&& go build -cover -o bin/aontu-cov ./cmd/aontu \
		&& go build -cover -o bin/aontu-lsp-cov ./cmd/aontu-lsp
	cd go && GOCOVERDIR=covdata ./bin/aontu-cov --version >/dev/null
	cd go && echo 'a:1' | GOCOVERDIR=covdata ./bin/aontu-cov >/dev/null
	cd go && GOCOVERDIR=covdata ./bin/aontu-lsp-cov </dev/null >/dev/null || true
	cd go && go tool covdata textfmt -i=covdata -o coverage-main.out
	cd go && go run ./scripts/covmerge coverage-unit.out coverage-main.out > coverage.out
	cd go && go tool cover -func=coverage.out | tail -1
	@cd go && n=$$(awk '$$NF==0' coverage.out | wc -l | tr -d ' '); \
		if [ "$$n" != "0" ]; then \
			echo "covcheck: $$n uncovered block(s) — ADR-002 requires 100%:"; \
			awk '$$NF==0 {print "  " $$1}' coverage.out; \
			echo; \
			echo "Close each with a shared spec row (preferred), a Go test, or —"; \
			echo "only when genuinely unreachable — a //coverage:ignore marker"; \
			echo "carrying its justification. See ADR.md."; \
			exit 1; \
		fi; \
		echo "covcheck: 100% (ADR-002)"
	cd go && rm -rf covdata bin coverage-unit.out coverage-main.out

# TypeScript (canonical implementation, package lives in ts/)
build-ts:
	cd ts && npm run build

test-ts:
	cd ts && npm test

clean-ts:
	rm -rf ts/dist ts/dist-test

# Go
build-go:
	cd go && go build ./...

test-go:
	cd go && go test -v ./...

clean-go:
	cd go && go clean

# Publish Go module: make publish-go V=0.1.2
publish-go: test-go
	@test -n "$(V)" || (echo "Usage: make publish-go V=x.y.z" && exit 1)
	# Portable in-place edit: `sed -i ''` is BSD/macOS only and fails on
	# GNU sed (it reads '' as the script), which left VERSION stale.
	perl -pi -e 's/^const VERSION = ".*"/const VERSION = "$(V)"/' go/aontu.go
	@grep -q '^const VERSION = "$(V)"' go/aontu.go || \
	  (echo "publish-go: failed to set VERSION in go/aontu.go" && exit 1)
	git add go/aontu.go
	git commit -m "go: v$(V)"
	git tag go/v$(V)
	git push origin main go/v$(V)
	if command -v gh >/dev/null 2>&1; then gh release create go/v$(V) --title "go/v$(V)" --notes "Go module release v$(V)"; fi

tags-go:
	git tag -l 'go/v*' --sort=-version:refname

reset:
	cd ts && npm run reset
	cd go && go clean -cache
	cd go && go build ./...
	cd go && go test -v ./...
