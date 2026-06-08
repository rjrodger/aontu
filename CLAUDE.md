# CLAUDE.md

See [AGENTS.md](AGENTS.md) for the full contributor and agent guide:
repository layout, build/test commands, the shared `test/spec/*.tsv`
suite, and TypeScript/Go parity conventions.

Quick reference:

- TypeScript (`ts/`) is the canonical implementation; the Go port
  (`go/`) is kept in parity for the subset it implements.
- `ts/dist` and `ts/dist-test` are committed — rebuild after editing
  `ts/src` or `ts/test` (`make build-ts`).
- Shared behaviour lives in `test/spec/*.tsv` and is run by both
  `ts/test/spec.test.ts` and `go/spec_test.go`.
- `make test` runs both suites.
