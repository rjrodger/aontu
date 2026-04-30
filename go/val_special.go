/* Copyright (c) 2021-2025 Richard Rodger, MIT License */

package aontu

import "fmt"

// NilVal represents a unification error.
type NilVal struct {
	ValBase
	why       string
	msg       string
	primary   Val
	secondary Val
	attempt   string
	details   map[string]interface{}
}

// Shared sentinel for trial-mode failures (DisjunctVal).
var trialNil = &NilVal{
	ValBase: ValBase{id: -1, dc: DONE},
	why:     "trial",
}

func NewNilVal(spec *ValSpec) *NilVal {
	nv := &NilVal{
		ValBase: NewValBase(spec),
	}
	nv.dc = DONE
	if spec != nil {
		nv.why = spec.Why
		nv.msg = spec.Msg
	}
	return nv
}

func (v *NilVal) IsNil() bool    { return true }
func (v *NilVal) Done() bool     { return true }

func (v *NilVal) Unify(_ Val, _ *AontuContext) Val {
	return v // errors propagate
}

func (v *NilVal) Gen(ctx *AontuContext) (interface{}, error) {
	if ctx != nil && !ctx.collect {
		return nil, &AontuError{Msg: v.msg, Errs: []*NilVal{v}}
	}
	return nil, nil
}

func (v *NilVal) Clone(_ *AontuContext, _ *ValSpec) Val {
	return v
}

func (v *NilVal) SpreadClone(_ *AontuContext) Val {
	return v
}

func (v *NilVal) Canon() string {
	return fmt.Sprintf("nil/%s", v.why)
}

func (v *NilVal) Superior() Val {
	return v
}

func (v *NilVal) Why() string { return v.why }
func (v *NilVal) Msg() string { return v.msg }
