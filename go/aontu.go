/* Copyright (c) 2025 Richard Rodger, MIT License */

package aontu

import (
	"path/filepath"
	"sort"
)

// Version is the Aontu Go module version.
// VERSION is the Aontu Go module version, rewritten by `make publish-go`.
// Spelled in caps to match ts/src/aontu.ts's exported VERSION, so the two
// ports name the same thing the same way. Note the two version SERIES are
// independent: the Go module is 0.1.x, the npm package 0.49.x.
const VERSION = "0.1.10"

// TrustBudget bounds evaluation work (G5 trust profile, docs/trust.md):
// integer counts of engine events, never wall-clock. Zero means the
// default — the shared spec-visible constants test/spec/budget.tsv pins
// in both ports.
type TrustBudget struct {
	Passes int // fixpoint passes (default 9)
	Depth  int // structural recursion depth (default 1000)
}

// TrustOptions is the trust profile (G5, docs/trust.md): what an
// evaluation may read, and how much work it may do. The zero value is
// the 'system' posture — today's unconfined default. At most one of the
// Include fields should be set; the mirror of the canonical port's
// `trust.include` union ('none' | { mem } | { root } | 'system').
type TrustOptions struct {
	IncludeNone bool              // @"..." is always denied
	IncludeMem  map[string]string // a virtual file set only
	IncludeRoot string            // real files, realpath-confined below this root
	Budget      TrustBudget
}

// IncludeDep is one entry of the include manifest: a resolved include's
// absolute path and the capability that resolved it ("mem" or "file").
// The manifest is hermeticity clause 1's "file set" made observable
// (docs/trust.md); content hashing and pinning stay with G6.
type IncludeDep struct {
	Path       string
	Capability string
}

// Aontu is the top-level entry point, mirroring the TypeScript Aontu
// class (ts/src/aontu.ts).
type Aontu struct {
	// base is the directory used to resolve relative @"file" source
	// loads. Empty means the process working directory.
	base string

	// File is an optional display name for the entry source, rendered
	// in error frames the way the TS CLI renders its entry path
	// (`--> model.aon:3:5`). Empty renders `<no-file>`, as TS does for
	// string sources. Set it when evaluating a real file, e.g. from
	// cmd/aontu.
	File string

	// Trust is the evaluation's trust profile (G5, docs/trust.md).
	// Nil means the 'system' posture, today's default.
	Trust *TrustOptions

	// IncludeDeps is the include MANIFEST of the most recent parse:
	// the resolved include closure, sorted by path then capability and
	// deduplicated, so it is deterministic. Reset per parse; empty for
	// a document with no includes.
	IncludeDeps []IncludeDep

	// TrustWarn and TrustWarnRoot are the staged-flip warning window
	// (G5 phase 6, cmd/aontu only): under the 'system' posture every
	// resolution escaping TrustWarnRoot calls TrustWarn. Not a stable
	// embedding API.
	TrustWarn     func(kind, path string)
	TrustWarnRoot string
}

// New creates a new Aontu instance. Relative @"file" loads resolve from
// the process working directory.
func New() *Aontu { return &Aontu{} }

// NewWithBase creates an Aontu that resolves relative @"file" source
// loads against base, a directory. Use it when evaluating a source whose
// relative loads should be resolved from somewhere other than the
// process working directory, e.g. the directory of an entry file:
//
//	abs, _ := filepath.Abs(file)
//	a := aontu.NewWithBase(filepath.Dir(abs))
//
// Absolute @"file" paths are unaffected by base.
func NewWithBase(base string) *Aontu { return &Aontu{base: base} }

// Parse parses source into a Val AST, not yet unified.
//
// NOTE: the returned Val is SINGLE-USE. Unify/Generate refine the tree
// in place (see unifyRoot), so do not Unify/Generate the same Val more
// than once and do not use it from multiple goroutines. The Unify/
// Generate entry points re-parse per call, so this only matters if you
// hold a Parse result yourself; call Parse again for a fresh tree.
func (a *Aontu) Parse(src string) (Val, error) {
	return a.parseEntry(src)
}

// parseEntry runs the entry parse under this instance's trust profile,
// and leaves the include manifest on IncludeDeps.
func (a *Aontu) parseEntry(src string) (Val, error) {
	sink := a.newTrustSink()
	v, err := parseWithTrust(src, a.base, a.File, sink)
	a.IncludeDeps = manifestOf(*sink.deps)
	return v, err
}

// newTrustSink builds the per-parse trust sink the resolver reads
// (source.go): the capability, the warning window, and the manifest
// accumulator.
func (a *Aontu) newTrustSink() *trustSink {
	deps := []IncludeDep{}
	sink := &trustSink{deps: &deps, warn: a.TrustWarn, warnRoot: a.TrustWarnRoot}
	if nil != a.Trust {
		sink.none = a.Trust.IncludeNone
		sink.mem = a.Trust.IncludeMem
		if "" != a.Trust.IncludeRoot {
			root, err := filepath.Abs(a.Trust.IncludeRoot)
			if err != nil { //coverage:ignore Abs fails only on an unreadable cwd
				root = a.Trust.IncludeRoot
			}
			sink.root = root
		}
	}
	return sink
}

// manifestOf sorts and deduplicates the raw manifest sink into the
// deterministic include closure: by path then capability, byte order,
// one entry per (path, capability) pair. The identical rule to the
// canonical port (ts/src/aontu.ts manifestOf).
func manifestOf(deps []IncludeDep) []IncludeDep {
	seen := map[string]bool{}
	out := make([]IncludeDep, 0, len(deps))
	for _, dep := range deps {
		key := dep.Path + " " + dep.Capability
		if seen[key] {
			continue
		}
		seen[key] = true
		out = append(out, dep)
	}
	sort.Slice(out, func(i, j int) bool {
		ki := out[i].Path + " " + out[i].Capability
		kj := out[j].Path + " " + out[j].Capability
		return ki < kj
	})
	return out
}

// Unify parses and fully unifies source, returning the unified Val.
// A non-nil error is returned if parsing fails or unification produces
// any conflict.
func (a *Aontu) Unify(src string) (Val, error) {
	return a.UnifyVars(src, nil)
}

// UnifyVars is Unify with $name variables resolved from vars.
func (a *Aontu) UnifyVars(src string, vars map[string]Val) (Val, error) {
	v, err := a.parseEntry(src)
	if err != nil {
		return v, err
	}
	res, _, err := a.unifyCtx(v, vars, src)
	return res, err
}

// unifyCtx runs the fixpoint loop and returns the result with its
// context (which carries move()-hidden paths and variables used by
// generation). src is the entry source text, threaded for error
// frame rendering (NilVal.FullMessage).
func (a *Aontu) unifyCtx(v Val, vars map[string]Val, src string) (Val, *Ctx, error) {
	ctx := &Ctx{root: v, vars: vars, src: src, file: a.File}
	if nil != a.Trust {
		ctx.budgetPasses = a.Trust.Budget.Passes
		ctx.budgetDepth = a.Trust.Budget.Depth
	}
	res := unifyRoot(v, ctx)
	ctx.root = res
	if len(ctx.err) > 0 {
		// Code carries the first collected failure's why-code, mirroring
		// errs()[0].why on the TS AontuError thrown by handleErrors.
		return res, ctx, &AontuError{Msg: ctx.errmsg(), Code: ctx.err[0].why}
	}
	return res, ctx, nil
}

// Generate parses, unifies and generates the native output value,
// which must fully resolve to concrete values.
//
// The native types are:
//
//	map        map[string]any
//	list       []any
//	string     string
//	integer    int64
//	float      float64
//	biginteger *math/big.Int
//	bigdecimal *Decimal
//	boolean    bool
//	null       nil
//
// The last two numeric rows are the number tower's exact leaves, reached
// only by a `0d` literal or the NewBigInteger/NewBigDecimal
// constructors: a document that writes no `0d` generates exactly what it
// always did. Both are pointers, and both marshal as EXACT DIGITS in a
// raw JSON number, so encoding/json (json.Marshal, json.MarshalIndent)
// round-trips an exact value without loss — no conversion step and no
// custom encoder needed on the Go side.
func (a *Aontu) Generate(src string) (any, error) {
	return a.GenerateVars(src, nil)
}

// GenerateVars is Generate with $name variables resolved from vars.
func (a *Aontu) GenerateVars(src string, vars map[string]Val) (any, error) {
	v, perr := a.parseEntry(src)
	if perr != nil {
		return nil, perr
	}
	res, ctx, err := a.unifyCtx(v, vars, src)
	if err != nil {
		return nil, err
	}
	out, gerr := res.Gen(ctx)
	if gerr != nil {
		return nil, gerr
	}
	return out, nil
}
