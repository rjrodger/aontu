<a name="top"></a>

# Aontu: JSON Structure unifier

[![npm version](https://img.shields.io/npm/v/aontu.svg)](https://npmjs.com/package/aontu)
[![build](https://github.com/rjrodger/aontu/actions/workflows/build.yml/badge.svg)](https://github.com/rjrodger/aontu/actions/workflows/build.yml)
[![Coverage Status](https://coveralls.io/repos/github/rjrodger/aontu/badge.svg?branch=main)](https://coveralls.io/github/rjrodger/aontu?branch=main)
[![Known Vulnerabilities](https://snyk.io/test/github/rjrodger/aontu/badge.svg)](https://snyk.io/test/github/rjrodger/aontu)
[![DeepScan grade](https://deepscan.io/api/teams/5016/projects/26218/branches/831193/badge/grade.svg)](https://deepscan.io/dashboard#view=project&tid=5016&pid=26218&bid=831193)
[![Maintainability](https://api.codeclimate.com/v1/badges/2ee16ebd2281bc837d9b/maintainability)](https://codeclimate.com/github/rjrodger/aontu/maintainability)

| ![Voxgig](https://www.voxgig.com/res/img/vgt01r.png) | This open source module is sponsored and supported by [Voxgig](https://www.voxgig.com). |
|---|---|


This unifier is heavily inspired by [Cue Lang](https://cuelang.org/)
and may be regarded as a purpose-specific dialect.


## Implementations

Aontu ships two implementations, kept in parity (structure inspired by
[`voxgig/util`](https://github.com/voxgig/util)):

- **TypeScript** in [`ts/`](ts/) — the canonical implementation
  (published to npm as `aontu`).
- **Go** in [`go/`](go/) — a port (`github.com/rjrodger/aontu/go`) that
  mirrors the core unification semantics.

Both are checked against a single, language-agnostic test suite in
[`test/spec/`](test/spec/) (tab-separated cases run by both
implementations). See [AGENTS.md](AGENTS.md) and
[docs/shared-spec.md](docs/shared-spec.md).

```sh
make build   # build both (ts + go)
make test    # test both against the shared spec
```

### Repository layout

```
ts/          canonical TypeScript implementation (src, test, dist, dist-test)
go/          Go port (package aontu)
test/spec/   shared *.tsv unit tests both implementations must satisfy
docs/        documentation
```

