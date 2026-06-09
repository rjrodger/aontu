/* Copyright (c) 2025 Richard Rodger, MIT License */

package aontu

// Version is the Aontu Go module version.
const Version = "0.1.2"

// Aontu is the top-level entry point, mirroring the TypeScript Aontu
// class (ts/src/aontu.ts).
type Aontu struct {
	// base is the directory used to resolve relative @"file" source
	// loads. Empty means the process working directory.
	base string
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
func (a *Aontu) Parse(src string) (Val, error) {
	return parseBase(src, a.base)
}

// Unify parses and fully unifies source, returning the unified Val.
// A non-nil error is returned if parsing fails or unification produces
// any conflict.
func (a *Aontu) Unify(src string) (Val, error) {
	return a.UnifyVars(src, nil)
}

// UnifyVars is Unify with $name variables resolved from vars.
func (a *Aontu) UnifyVars(src string, vars map[string]Val) (Val, error) {
	v, err := parseBase(src, a.base)
	if err != nil {
		return v, err
	}
	res, _, err := a.unifyCtx(v, vars)
	return res, err
}

// unifyCtx runs the fixpoint loop and returns the result with its
// context (which carries move()-hidden paths and variables used by
// generation).
func (a *Aontu) unifyCtx(v Val, vars map[string]Val) (Val, *Ctx, error) {
	ctx := &Ctx{root: v, vars: vars}
	res := unifyRoot(v, ctx)
	ctx.root = res
	if len(ctx.err) > 0 {
		return res, ctx, &AontuError{Msg: ctx.errmsg()}
	}
	return res, ctx, nil
}

// Generate parses, unifies and generates the native output value,
// which must fully resolve to concrete values.
func (a *Aontu) Generate(src string) (any, error) {
	return a.GenerateVars(src, nil)
}

// GenerateVars is Generate with $name variables resolved from vars.
func (a *Aontu) GenerateVars(src string, vars map[string]Val) (any, error) {
	v, perr := parseBase(src, a.base)
	if perr != nil {
		return nil, perr
	}
	res, ctx, err := a.unifyCtx(v, vars)
	if err != nil {
		return nil, err
	}
	out, gerr := res.Gen(ctx)
	if gerr != nil {
		return nil, gerr
	}
	return out, nil
}
