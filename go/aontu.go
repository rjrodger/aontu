/* Copyright (c) 2025 Richard Rodger, MIT License */

package aontu

// Version is the Aontu Go module version.
const Version = "0.1.2"

// Aontu is the top-level entry point, mirroring the TypeScript Aontu
// class (ts/src/aontu.ts).
type Aontu struct{}

// New creates a new Aontu instance.
func New() *Aontu { return &Aontu{} }

// Parse parses source into a Val AST, not yet unified.
func (a *Aontu) Parse(src string) (Val, error) {
	return parse(src)
}

// Unify parses and fully unifies source, returning the unified Val.
// A non-nil error is returned if parsing fails or unification produces
// any conflict.
func (a *Aontu) Unify(src string) (Val, error) {
	return a.UnifyVars(src, nil)
}

// UnifyVars is Unify with $name variables resolved from vars.
func (a *Aontu) UnifyVars(src string, vars map[string]Val) (Val, error) {
	v, err := parse(src)
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
	v, perr := parse(src)
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
