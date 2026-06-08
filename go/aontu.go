/* Copyright (c) 2025 Richard Rodger, MIT License */

package aontu

// Version is the Aontu Go module version.
const Version = "0.0.1"

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
	v, err := parse(src)
	if err != nil {
		return v, err
	}
	ctx := &Ctx{root: v}
	res := unifyRoot(v, ctx)
	ctx.root = res
	if len(ctx.err) > 0 {
		return res, &AontuError{Msg: ctx.errmsg()}
	}
	return res, nil
}

// Generate parses, unifies and generates the native output value,
// which must fully resolve to concrete values.
func (a *Aontu) Generate(src string) (any, error) {
	res, err := a.Unify(src)
	if err != nil {
		return nil, err
	}
	out, gerr := res.Gen(&Ctx{root: res})
	if gerr != nil {
		return nil, gerr
	}
	return out, nil
}
