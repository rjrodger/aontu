/* Copyright (c) 2021-2025 Richard Rodger, MIT License */

package aontu

import "fmt"

// AontuError wraps unification errors.
type AontuError struct {
	Msg  string
	Errs []*NilVal
}

func (e *AontuError) Error() string {
	return e.Msg
}

// makeNilErr creates a NilVal representing a unification error.
// In trial mode (disjunct member testing), returns the shared trialNil sentinel.
func makeNilErr(ctx *AontuContext, why string, av, bv Val) *NilVal {
	if ctx != nil && ctx.trialMode {
		if len(ctx.err) == 0 || ctx.err[len(ctx.err)-1] != trialNil {
			ctx.err = append(ctx.err, trialNil)
		}
		return trialNil
	}

	spec := &ValSpec{Why: why}
	nil_ := NewNilVal(spec)

	if av != nil {
		nil_.primary = av
		s := av.GetSite()
		nil_.GetSite().Row = s.Row
		nil_.GetSite().Col = s.Col
		nil_.GetSite().URL = s.URL
	}
	if bv != nil {
		nil_.secondary = bv
		// Prefer the later source location
		bs := bv.GetSite()
		if bs.Row > nil_.GetSite().Row || (bs.Row == nil_.GetSite().Row && bs.Col > nil_.GetSite().Col) {
			nil_.GetSite().Row = bs.Row
			nil_.GetSite().Col = bs.Col
			nil_.GetSite().URL = bs.URL
		}
	}

	nil_.msg = descErrMsg(nil_, ctx)

	if ctx != nil {
		ctx.AddErr(nil_)
	}

	return nil_
}

func descErrMsg(nil_ *NilVal, ctx *AontuContext) string {
	hint := getHint(nil_.why)
	msg := fmt.Sprintf("[aontu/%s]: %s", nil_.why, hint)
	if nil_.primary != nil {
		msg += fmt.Sprintf(" [%s]", nil_.primary.Canon())
	}
	if nil_.secondary != nil {
		msg += fmt.Sprintf(" [%s]", nil_.secondary.Canon())
	}
	return msg
}

// hints maps error codes to human-readable explanations.
var hints = map[string]string{
	"scalar_value":   "Scalar values do not match",
	"scalar_kind":    "Scalar type does not match",
	"unify_no_src":   "Cannot resolve value at path $",
	"unify_no_res":   "Unification did not produce a result",
	"unify_cycle":    "Unification cycle detected",
	"nil_gen":        "Cannot generate value from nil",
	"conjunct":       "Unresolved conjunct",
	"mapval_closed":  "Map is closed and cannot accept new keys",
	"listval_closed": "List is closed and cannot accept new elements",
	"trial":          "Trial failure",
}

func getHint(why string) string {
	if h, ok := hints[why]; ok {
		return h
	}
	return why
}
