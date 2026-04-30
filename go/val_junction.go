/* Copyright (c) 2021-2025 Richard Rodger, MIT License */

package aontu

import (
	"sort"
	"strings"
)

// --- ConjunctVal ---

type ConjunctVal struct {
	ValBase
	canonCache *string
}

func NewConjunctVal(spec *ValSpec, ctx *AontuContext) *ConjunctVal {
	cv := &ConjunctVal{ValBase: NewValBase(spec)}
	if spec != nil && spec.Peg != nil {
		if terms, ok := spec.Peg.([]Val); ok {
			filtered := make([]Val, 0, len(terms))
			for _, t := range terms {
				if t != nil {
					filtered = append(filtered, t)
				}
			}
			cv.peg = filtered
		} else {
			cv.peg = []Val{}
		}
	} else {
		cv.peg = []Val{}
	}
	if spec != nil && spec.Mark != nil {
		cv.mark.Type = spec.Mark.Type
		cv.mark.Hide = spec.Mark.Hide
	}
	return cv
}

func (v *ConjunctVal) IsConjunct() bool { return true }
func (v *ConjunctVal) IsJunction() bool { return true }
func (v *ConjunctVal) IsGenable() bool  { return true }
func (v *ConjunctVal) IsFeature() bool  { return true }
func (v *ConjunctVal) CJO() int         { return 40000 }

func (v *ConjunctVal) Terms() []Val {
	if terms, ok := v.peg.([]Val); ok {
		return terms
	}
	return nil
}

func (v *ConjunctVal) Append(peer Val) {
	terms := v.Terms()
	v.peg = append(terms, peer)
	propagateMarks(v, peer)
}

func (v *ConjunctVal) Unify(peer Val, ctx *AontuContext) Val {
	if peer == nil {
		peer = top()
	}
	if v.Done() && peer.IsTop() {
		return v
	}

	done := true
	terms := normConjunct(v.Terms())
	v.peg = terms

	// Unify each term against peer
	upeer := make([]Val, len(terms))
	newtype := v.mark.Type || peer.GetMark().Type
	newhide := v.mark.Hide || peer.GetMark().Hide

	for _, t := range terms {
		newtype = t.GetMark().Type || newtype
		newhide = t.GetMark().Hide || newhide
	}

	for i, t := range terms {
		t.GetMark().Type = newtype
		t.GetMark().Hide = newhide

		if t.Done() && peer.IsTop() {
			upeer[i] = t
		} else {
			upeer[i] = unite(ctx, t, peer, "cj-own")
		}
		upeer[i].GetMark().Type = newtype
		upeer[i].GetMark().Hide = newhide
		newtype = newtype || upeer[i].GetMark().Type
		newhide = newhide || upeer[i].GetMark().Hide
		done = done && (upeer[i].GetDC() == DONE)

		if upeer[i].IsNil() {
			return upeer[i]
		}
	}

	upeer = normConjunct(upeer)

	// Fold terms against each other
	outvals := []Val{}
	if len(upeer) == 0 {
		return top()
	}

	t0 := upeer[0]
	for pI := 0; pI < len(upeer); pI++ {
		var t1 Val
		if pI+1 < len(upeer) {
			t1 = upeer[pI+1]
		}

		if t1 == nil {
			outvals = append(outvals, t0)
			newtype = v.mark.Type || t0.GetMark().Type
			newhide = v.mark.Hide || t0.GetMark().Hide
		} else if t0.IsPath() && !t1.IsPath() {
			outvals = append(outvals, t0)
			t0 = t1
		} else if t1.IsPath() && !t0.IsPath() {
			outvals = append(outvals, t0)
			t0 = t1
		} else {
			val := unite(ctx, t0, t1, "cj-peer-t0t1")
			done = done && (val.GetDC() == DONE)
			newtype = v.mark.Type || val.GetMark().Type
			newhide = v.mark.Hide || val.GetMark().Hide

			if val.IsConjunct() {
				outvals = append(outvals, t0)
				t0 = t1
			} else if val.IsNil() {
				return val
			} else {
				t0 = val
			}
		}
	}

	var out Val
	if len(outvals) == 0 {
		out = top()
	} else if len(outvals) == 1 {
		out = outvals[0]
		out.GetMark().Type = newtype
		out.GetMark().Hide = newhide
	} else {
		out = NewConjunctVal(&ValSpec{
			Peg:  outvals,
			Mark: &ValMark{Type: newtype, Hide: newhide},
		}, ctx)
	}

	if done {
		out.SetDC(DONE)
	} else {
		out.SetDC(v.dc + 1)
	}

	return out
}

func (v *ConjunctVal) Gen(ctx *AontuContext) (interface{}, error) {
	terms := v.Terms()
	// If conjunct contains a spread + generable, gen the generable
	if len(terms) == 2 {
		if terms[0].IsSpread() && terms[1].IsGenable() {
			return terms[1].Gen(ctx)
		}
		if terms[1].IsSpread() && terms[0].IsGenable() {
			return terms[0].Gen(ctx)
		}
	}
	return nil, &AontuError{Msg: "unresolved conjunct: " + v.Canon()}
}

func (v *ConjunctVal) Clone(ctx *AontuContext, spec *ValSpec) Val {
	terms := v.Terms()
	newTerms := make([]Val, len(terms))
	for i, t := range terms {
		ms := &ValSpec{}
		if spec != nil && spec.Mark != nil {
			ms.Mark = spec.Mark
		}
		newTerms[i] = t.Clone(ctx, ms)
	}
	out := NewConjunctVal(&ValSpec{Peg: newTerms}, ctx)
	if ctx != nil {
		out.path = ctx.path
	}
	if v.Done() {
		out.dc = DONE
	}
	copySite(&v.ValBase, &out.ValBase)
	return out
}

func (v *ConjunctVal) Canon() string {
	if v.canonCache != nil && v.Done() {
		return *v.canonCache
	}
	terms := v.Terms()
	parts := make([]string, len(terms))
	for i, t := range terms {
		c := t.Canon()
		if t.IsJunction() {
			if cv, ok := t.(*ConjunctVal); ok {
				if ts := cv.Terms(); len(ts) > 1 {
					c = "(" + c + ")"
				}
			} else if dv, ok := t.(*DisjunctVal); ok {
				if ts := dv.Terms(); len(ts) > 1 {
					c = "(" + c + ")"
				}
			}
		}
		parts[i] = c
	}
	result := strings.Join(parts, "&")
	if v.Done() {
		v.canonCache = &result
	}
	return result
}

func (v *ConjunctVal) Superior() Val { return top() }

// normConjunct flattens nested conjuncts and sorts by CJO.
func normConjunct(terms []Val) []Val {
	var expand []Val
	var flattenTerms func([]Val)
	flattenTerms = func(ts []Val) {
		for _, t := range ts {
			if t.IsConjunct() {
				flattenTerms(t.(*ConjunctVal).Terms())
			} else {
				expand = append(expand, t)
			}
		}
	}
	flattenTerms(terms)

	sorted := true
	for i := 1; i < len(expand); i++ {
		if expand[i-1].CJO() > expand[i].CJO() {
			sorted = false
			break
		}
	}
	if !sorted {
		sort.Slice(expand, func(i, j int) bool {
			return expand[i].CJO() < expand[j].CJO()
		})
	}
	return expand
}

// --- DisjunctVal ---

type DisjunctVal struct {
	ValBase
	prefsRanked bool
	canonCache  *string
}

func NewDisjunctVal(spec *ValSpec, ctx *AontuContext) *DisjunctVal {
	dv := &DisjunctVal{ValBase: NewValBase(spec)}
	if spec != nil && spec.Peg != nil {
		if terms, ok := spec.Peg.([]Val); ok {
			dv.peg = terms
		} else {
			dv.peg = []Val{}
		}
	} else {
		dv.peg = []Val{}
	}
	return dv
}

func (v *DisjunctVal) IsDisjunct() bool { return true }
func (v *DisjunctVal) IsJunction() bool { return true }
func (v *DisjunctVal) IsGenable() bool  { return true }
func (v *DisjunctVal) IsFeature() bool  { return true }
func (v *DisjunctVal) CJO() int         { return 35000 }

func (v *DisjunctVal) Terms() []Val {
	if terms, ok := v.peg.([]Val); ok {
		return terms
	}
	return nil
}

func (v *DisjunctVal) Append(peer Val) {
	terms := v.Terms()
	v.peg = append(terms, peer)
	v.prefsRanked = false
}

func (v *DisjunctVal) Unify(peer Val, ctx *AontuContext) Val {
	if peer == nil {
		peer = top()
	}
	if v.Done() && peer.IsTop() {
		return v
	}

	if !v.prefsRanked {
		v.rankPrefs(ctx)
	}

	done := true
	terms := v.Terms()
	oval := make([]Val, len(terms))

	// Trial mode: save and restore ctx.err
	savedErr := ctx.err
	savedTrialMode := ctx.trialMode
	ctx.trialMode = true

	for i, t := range terms {
		trialErr := []*NilVal{}
		ctx.err = trialErr

		oval[i] = unite(ctx, t, peer, "dj-peer")

		if len(trialErr) > 0 {
			oval[i] = trialNil
		}
		done = done && (oval[i].GetDC() == DONE)
	}

	ctx.trialMode = savedTrialMode
	ctx.err = savedErr

	// Flatten nested disjuncts and dedup
	if len(oval) > 1 {
		expanded := []Val{}
		for _, o := range oval {
			if o.IsDisjunct() {
				expanded = append(expanded, o.(*DisjunctVal).Terms()...)
			} else {
				expanded = append(expanded, o)
			}
		}
		oval = expanded

		// Dedup
		for i := 0; i < len(oval); i++ {
			for j := i + 1; j < len(oval); j++ {
				if oval[j].Same(oval[i]) {
					oval[j] = trialNil
				}
			}
		}

		// Filter nil
		filtered := []Val{}
		for _, o := range oval {
			if !o.IsNil() {
				filtered = append(filtered, o)
			}
		}
		oval = filtered
	}

	var out Val
	if len(oval) == 1 {
		out = oval[0]
	} else if len(oval) == 0 {
		return makeNilErr(ctx, "|:empty", v, peer)
	} else {
		out = NewDisjunctVal(&ValSpec{Peg: oval}, ctx)
	}

	if done {
		out.SetDC(DONE)
	} else {
		out.SetDC(v.dc + 1)
	}

	return out
}

func (v *DisjunctVal) rankPrefs(ctx *AontuContext) {
	terms := v.Terms()
	var lastpref *PrefVal
	lastprefI := -1

	for i := 0; i < len(terms); i++ {
		t := terms[i]
		if pv, ok := t.(*PrefVal); ok {
			if lastpref != nil {
				if pv.rank == lastpref.rank {
					merged := pv.Unify(lastpref, ctx)
					if merged.IsNil() {
						return
					}
					if mp, ok := merged.(*PrefVal); ok {
						terms[lastprefI] = mp
						lastpref = mp
					}
					terms[i] = nil
				} else if pv.rank < lastpref.rank {
					terms[lastprefI] = nil
					lastpref = pv
					lastprefI = i
				} else {
					terms[i] = nil
				}
			} else {
				lastpref = pv
				lastprefI = i
			}
		}
	}

	filtered := []Val{}
	for _, t := range terms {
		if t != nil {
			filtered = append(filtered, t)
		}
	}
	v.peg = filtered
	v.prefsRanked = true
}

func (v *DisjunctVal) Gen(ctx *AontuContext) (interface{}, error) {
	terms := v.Terms()
	if len(terms) > 0 {
		// Prefer PrefVals
		prefs := []Val{}
		for _, t := range terms {
			if t.IsPref() {
				prefs = append(prefs, t)
			}
		}
		vals := prefs
		if len(vals) == 0 {
			vals = terms
		}
		val := vals[0]
		for i := 1; i < len(vals); i++ {
			val = val.Unify(terms[i], ctx)
		}
		return val.Gen(ctx)
	}
	return nil, nil
}

func (v *DisjunctVal) Clone(ctx *AontuContext, spec *ValSpec) Val {
	terms := v.Terms()
	newTerms := make([]Val, len(terms))
	for i, t := range terms {
		ms := &ValSpec{}
		if spec != nil && spec.Mark != nil {
			ms.Mark = spec.Mark
		}
		newTerms[i] = t.Clone(ctx, ms)
	}
	out := NewDisjunctVal(&ValSpec{Peg: newTerms}, ctx)
	if ctx != nil {
		out.path = ctx.path
	}
	if v.Done() {
		out.dc = DONE
	}
	copySite(&v.ValBase, &out.ValBase)
	return out
}

func (v *DisjunctVal) Canon() string {
	if v.canonCache != nil && v.Done() {
		return *v.canonCache
	}
	terms := v.Terms()
	parts := make([]string, len(terms))
	for i, t := range terms {
		c := t.Canon()
		if t.IsJunction() {
			if dv, ok := t.(*DisjunctVal); ok {
				ts := dv.Terms()
				if ts != nil && len(ts) > 1 {
					c = "(" + c + ")"
				}
			} else if cv, ok := t.(*ConjunctVal); ok {
				ts := cv.Terms()
				if ts != nil && len(ts) > 1 {
					c = "(" + c + ")"
				}
			}
		}
		parts[i] = c
	}
	result := strings.Join(parts, "|")
	if v.Done() {
		v.canonCache = &result
	}
	return result
}

func (v *DisjunctVal) Superior() Val { return top() }

