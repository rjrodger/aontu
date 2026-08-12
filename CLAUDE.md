# CLAUDE.md

See [AGENTS.md](AGENTS.md) for the full contributor and agent guide:
repository layout, build/test commands, the shared `test/spec/*.tsv`
suite, and TypeScript/Go parity conventions.

Fundamentals are recorded in [ADR.md](ADR.md): ADR-001 (TS/Go full
parity via the shared spec) and ADR-002 (100 % coverage in both, every
exclusion justified). Do not reverse those without a new ADR entry.

Quick reference:

- TypeScript (`ts/`) is the canonical implementation; the Go port
  (`go/`) is kept in parity for the subset it implements.
- `ts/dist` and `ts/dist-test` are committed — rebuild after editing
  `ts/src` or `ts/test` (`make build-ts`).
- Shared behaviour lives in `test/spec/*.tsv` and is run by both
  `ts/test/spec.test.ts` and `go/spec_test.go`.
- `make test` runs both suites; `make cov` checks the ADR-002 floor.
