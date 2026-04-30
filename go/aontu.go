/* Copyright (c) 2021-2025 Richard Rodger, MIT License */

// Package aontu implements a lattice-based unification engine.
package aontu

const Version = "0.1.1"
const DefaultMaxCC = 9

// Aontu is the main entry point for parsing, unifying, and generating.
type Aontu struct {
	opts *AontuOptions
	lang *Lang
}

func NewAontu(opts *AontuOptions) *Aontu {
	if opts == nil {
		opts = &AontuOptions{}
	}
	return &Aontu{opts: opts, lang: NewLang(opts)}
}

// Parse converts source text into a Val tree.
func (a *Aontu) Parse(src string) (Val, error) {
	return a.lang.Parse(src)
}

// Generate parses, unifies, and generates output from source text.
func (a *Aontu) Generate(src string) (interface{}, error) {
	val, err := a.Parse(src)
	if err != nil {
		return nil, err
	}
	if val == nil || val.IsNil() {
		if val != nil && val.IsNil() {
			return nil, &AontuError{Msg: val.Canon()}
		}
		return nil, nil
	}
	return a.GenerateVal(val, a.opts)
}

// UnifyVal takes a parsed Val and runs the fixpoint unification loop.
func (a *Aontu) UnifyVal(pval Val, opts *AontuOptions) (*UnifyResult, error) {
	ctx := NewAontuContext(opts)
	if ctx.opts == nil {
		ctx.opts = a.opts
	}
	ctx.root = pval

	result := RunUnify(pval, ctx)
	return result, nil
}

// GenerateVal unifies and then generates output from a parsed Val.
func (a *Aontu) GenerateVal(pval Val, opts *AontuOptions) (interface{}, error) {
	result, err := a.UnifyVal(pval, opts)
	if err != nil {
		return nil, err
	}
	if result.Res == nil {
		return nil, &AontuError{Msg: "unification produced no result"}
	}
	if result.Res.IsNil() {
		return nil, &AontuError{Msg: "unification produced nil: " + result.Res.Canon()}
	}

	ctx := NewAontuContext(opts)
	ctx.collect = true
	g, err := result.Res.Gen(ctx)
	if err != nil {
		return nil, err
	}
	return g, nil
}

// UnifyResult holds the result of the unification process.
type UnifyResult struct {
	Res Val
	Err []*NilVal
	CC  int
}

// RunUnify performs the fixpoint unification loop.
// First resolves paths (PathVals replaced with cloned targets),
// then runs fixpoint unite(root, TOP) until convergence.
func RunUnify(pval Val, ctx *AontuContext) *UnifyResult {
	maxcc := DefaultMaxCC

	res := pval
	ctx.root = res

	// Path resolution: resolve PathVals by finding their targets in the tree
	// and replacing them with clones. This must happen before the fixpoint loop
	// because paths need the tree structure to resolve.
	// (In TS this is resolvePaths() — we do a simpler version here by
	// relying on PathVal.Unify which calls Find() during the fixpoint loop.)

	var errs []*NilVal

	for cc := 0; cc < maxcc; cc++ {
		ctx.cc = cc
		ctx.seen = make(map[string]int) // Clear per iteration

		res = unite(ctx, res, top(), "unify")

		ctx.root = res

		if res.Done() {
			break
		}
		if res.IsNil() {
			break
		}
	}

	errs = ctx.err

	return &UnifyResult{
		Res: res,
		Err: errs,
		CC:  ctx.cc,
	}
}
