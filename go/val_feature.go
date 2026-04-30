/* Copyright (c) 2021-2025 Richard Rodger, MIT License */

package aontu

import (
	"fmt"
	"strings"
)

// --- PrefVal: preference/default value (*x) ---

type PrefVal struct {
	ValBase
	superpeg Val
	rank     int
}

func NewPrefVal(spec *ValSpec, ctx *AontuContext) *PrefVal {
	pv := &PrefVal{
		ValBase: NewValBase(spec),
	}
	// Calculate rank from nested prefs
	if pegPref, ok := spec.Peg.(*PrefVal); ok {
		pv.rank = 1 + pegPref.rank
	}
	// Calculate superior
	if pv.peg != nil {
		if pegVal, ok := pv.peg.(Val); ok {
			pv.superpeg = pegVal.Superior()
		} else {
			pv.superpeg = top()
		}
	} else {
		pv.superpeg = top()
	}
	return pv
}

func (v *PrefVal) IsPref() bool    { return true }
func (v *PrefVal) IsGenable() bool { return true }
func (v *PrefVal) IsFeature() bool { return true }
func (v *PrefVal) CJO() int       { return 30000 }

func (v *PrefVal) Unify(peer Val, ctx *AontuContext) Val {
	if peer == nil {
		peer = top()
	}

	done := true
	var out Val = v

	// Resolve peg if not done
	if pegVal, ok := v.peg.(Val); ok && !pegVal.Done() {
		resolved := unite(ctx, pegVal, top(), "pref/resolve")
		v.peg = resolved
		v.superpeg = resolved.Superior()
	} else if v.superpeg != nil && v.superpeg.IsTop() && pegVal != nil && !pegVal.IsTop() {
		v.superpeg = pegVal.Superior()
	}

	if peerPref, ok := peer.(*PrefVal); ok {
		if v.id == peerPref.id {
			out = v
		} else if pegVal, ok := v.peg.(Val); ok {
			if peerPegVal, ok2 := peerPref.peg.(Val); ok2 && pegVal.GetID() == peerPegVal.GetID() {
				out = v
			} else if v.rank < peerPref.rank {
				out = v
			} else if peerPref.rank < v.rank {
				out = peer
			} else {
				peg := unite(ctx, pegVal, peerPegVal, "pref-peer")
				out = NewPrefVal(&ValSpec{Peg: peg}, ctx)
			}
		}
	} else if !peer.IsTop() {
		pegVal, ok := v.peg.(Val)
		if ok && !pegVal.Done() {
			// Defer: peg is unresolved
			out = NewConjunctVal(&ValSpec{Peg: []Val{v, peer}}, ctx)
			done = false
		} else {
			out = unite(ctx, v.superpeg, peer, "pref-super")
			if out.Same(v.superpeg) {
				if pegVal != nil {
					out = pegVal
				}
			}
		}
	}

	if done {
		out.SetDC(DONE)
	} else {
		out.SetDC(v.dc + 1)
	}

	return out
}

func (v *PrefVal) Gen(ctx *AontuContext) (interface{}, error) {
	if pegVal, ok := v.peg.(Val); ok {
		return pegVal.Gen(ctx)
	}
	return v.peg, nil
}

func (v *PrefVal) Clone(ctx *AontuContext, spec *ValSpec) Val {
	var pegClone interface{}
	if pegVal, ok := v.peg.(Val); ok {
		pegClone = pegVal.Clone(ctx, &ValSpec{Mark: &ValMark{}})
	} else {
		pegClone = v.peg
	}
	out := NewPrefVal(&ValSpec{Peg: pegClone}, ctx)
	if ctx != nil {
		out.path = ctx.path
	}
	if v.Done() {
		out.dc = DONE
	}
	copySite(&v.ValBase, &out.ValBase)
	return out
}

func (v *PrefVal) Canon() string {
	if pegVal, ok := v.peg.(Val); ok {
		return "*" + pegVal.Canon()
	}
	return fmt.Sprintf("*%v", v.peg)
}

func (v *PrefVal) Superior() Val { return top() }

// --- PathVal: path references ($.a.b.c) ---

type PathVal struct {
	ValBase
	absolute bool
	prefix   bool
	resolved Val
}

func NewPathVal(spec *ValSpec, ctx *AontuContext) *PathVal {
	pv := &PathVal{
		ValBase: NewValBase(spec),
	}
	if spec != nil {
		pv.absolute = spec.Absolute
		pv.prefix = spec.Prefix
	}
	// peg is []string or []Val (path segments)
	return pv
}

func (v *PathVal) IsPath() bool          { return true }
func (v *PathVal) IsFeature() bool       { return true }
func (v *PathVal) IsPathDependent() bool { return true }
func (v *PathVal) CJO() int             { return 50000 }

func (v *PathVal) PathSegments() []string {
	switch p := v.peg.(type) {
	case []string:
		return p
	case []interface{}:
		out := make([]string, len(p))
		for i, s := range p {
			out[i] = fmt.Sprintf("%v", s)
		}
		return out
	default:
		return nil
	}
}

// Find resolves the path in the given context root.
// Matches TS PathVal.find() logic.
func (v *PathVal) Find(ctx *AontuContext) Val {
	if v.resolved != nil {
		return v.resolved
	}
	if ctx == nil || ctx.root == nil {
		return nil
	}

	segments := v.PathSegments()
	if segments == nil {
		return nil
	}

	// Cycle detection: check if peg is a prefix of path
	isPrefixPath := len(segments) <= len(v.path)
	if isPrefixPath {
		for i := 0; i < len(segments); i++ {
			if segments[i] != v.path[i] {
				isPrefixPath = false
				break
			}
		}
	}
	if isPrefixPath {
		return makeNilErr(ctx, "path_cycle", v, nil)
	}

	// Build refpath
	var refpath []string
	if v.absolute {
		refpath = segments
	} else {
		// Relative: sibling path (drop last element of self path, append segments)
		if len(v.path) > 1 {
			refpath = make([]string, len(v.path)-1)
			copy(refpath, v.path[:len(v.path)-1])
		}
		refpath = append(refpath, segments...)
	}

	// Reduce: "." entries mean "go up one level" (pop last segment).
	// Matches TS: refpath.reduce((a, p) => (p === '.' ? a.length-- : a.push(p), a), [])
	reduced := make([]string, 0, len(refpath))
	for _, p := range refpath {
		if p == "." {
			if len(reduced) > 0 {
				reduced = reduced[:len(reduced)-1]
			}
		} else {
			reduced = append(reduced, p)
		}
	}
	refpath = reduced

	// Navigate tree
	node := ctx.root
	pI := 0
	nopath := false

	for ; pI < len(refpath); pI++ {
		if node == nil {
			nopath = true
			break
		}
		part := refpath[pI]

		if node.IsMap() {
			m := node.(*MapVal).PegMap()
			if m == nil {
				nopath = true
				break
			}
			child, ok := m[part]
			if !ok {
				nopath = true
				break
			}
			node = child
		} else if node.IsList() {
			l := node.(*ListVal).PegList()
			if l == nil {
				nopath = true
				break
			}
			idx := 0
			valid := true
			for _, c := range part {
				if c < '0' || c > '9' {
					valid = false
					break
				}
				idx = idx*10 + int(c-'0')
			}
			if !valid || idx >= len(l) {
				nopath = true
				break
			}
			node = l[idx]
		} else if node.IsConjunct() || node.IsDisjunct() {
			// Collect matching children from all junction terms,
			// flattening nested conjuncts and disjuncts.
			var matches []Val
			var stack []Val
			if cv, ok := node.(*ConjunctVal); ok {
				stack = append(stack, cv.Terms()...)
			} else if dv, ok := node.(*DisjunctVal); ok {
				stack = append(stack, dv.Terms()...)
			}
			for len(stack) > 0 {
				term := stack[len(stack)-1]
				stack = stack[:len(stack)-1]
				if term.IsConjunct() {
					stack = append(stack, term.(*ConjunctVal).Terms()...)
				} else if term.IsDisjunct() {
					stack = append(stack, term.(*DisjunctVal).Terms()...)
				} else if term.IsSpread() {
					if pegVal, ok := term.GetPeg().(Val); ok {
						matches = append(matches, pegVal)
					}
				} else if term.IsMap() {
					m := term.(*MapVal).PegMap()
					if child, ok := m[part]; ok {
						matches = append(matches, child)
					}
				} else if term.IsList() {
					l := term.(*ListVal).PegList()
					idx := 0
					valid := true
					for _, c := range part {
						if c < '0' || c > '9' {
							valid = false
							break
						}
						idx = idx*10 + int(c-'0')
					}
					if valid && idx < len(l) {
						matches = append(matches, l[idx])
					}
				}
			}
			if len(matches) == 1 {
				node = matches[0]
			} else if len(matches) > 1 {
				if node.IsConjunct() {
					node = NewConjunctVal(&ValSpec{Peg: matches}, nil)
				} else {
					node = NewDisjunctVal(&ValSpec{Peg: matches}, nil)
				}
			} else {
				node = nil
				nopath = true
				break
			}
		} else if node.IsPath() {
			// Node is an unresolved PathVal — try to resolve it first
			innerPv := node.(*PathVal)
			resolved := innerPv.Find(ctx)
			if resolved != nil && !resolved.IsNil() {
				node = resolved
				pI-- // Re-process this segment with the resolved node
			} else {
				// Can't resolve yet — not an error, just not ready
				break
			}
		} else if node.Done() {
			nopath = true
			break
		} else {
			break
		}
	}

	if nopath {
		return makeNilErr(ctx, "no_path", v, nil)
	}

	if pI == len(refpath) && node != nil {
		// Clone the found value, clear type/hide marks
		out := node.Clone(ctx, nil)
		out.GetMark().Type = false
		out.GetMark().Hide = false
		walk(out, func(child Val, _ []string, _ int) bool {
			child.GetMark().Type = false
			child.GetMark().Hide = false
			return true
		}, 32)
		return out
	}

	return nil
}

func (v *PathVal) Unify(peer Val, ctx *AontuContext) Val {
	if peer == nil {
		peer = top()
	}

	found := v.Find(ctx)
	if found == nil {
		v.dc++
		return v
	}

	if found.IsNil() {
		return found
	}

	// Clone the found value
	cloned := found.Clone(ctx, &ValSpec{Path: v.path, Mark: &ValMark{}})

	result := unite(ctx, cloned, peer, "path-resolve")
	return result
}

func (v *PathVal) Gen(_ *AontuContext) (interface{}, error) {
	return nil, &AontuError{Msg: "unresolved path: " + v.Canon()}
}

func (v *PathVal) Clone(ctx *AontuContext, spec *ValSpec) Val {
	out := NewPathVal(&ValSpec{
		Peg:      v.peg,
		Absolute: v.absolute,
		Prefix:   v.prefix,
	}, ctx)
	if ctx != nil {
		out.path = ctx.path
	}
	if spec != nil && spec.Path != nil {
		out.path = spec.Path
	}
	copySite(&v.ValBase, &out.ValBase)
	return out
}

func (v *PathVal) Canon() string {
	segments := v.PathSegments()
	if v.absolute {
		return "$." + strings.Join(segments, ".")
	}
	return "." + strings.Join(segments, ".")
}

func (v *PathVal) Superior() Val { return top() }

// --- VarVal: variable references (?x) ---

type VarVal struct {
	ValBase
}

func NewVarVal(spec *ValSpec, ctx *AontuContext) *VarVal {
	return &VarVal{ValBase: NewValBase(spec)}
}

func (v *VarVal) IsVar() bool     { return true }
func (v *VarVal) IsFeature() bool { return true }

func (v *VarVal) Unify(peer Val, ctx *AontuContext) Val {
	name, ok := v.peg.(string)
	if !ok {
		return makeNilErr(ctx, "var", v, peer)
	}

	val, exists := ctx.vars[name]
	if !exists {
		return makeNilErr(ctx, "var", v, peer)
	}

	if peer == nil || peer.IsTop() {
		return val
	}
	return unite(ctx, val, peer, "var-resolve")
}

func (v *VarVal) Gen(_ *AontuContext) (interface{}, error) {
	return nil, &AontuError{Msg: "unresolved variable"}
}

func (v *VarVal) Clone(ctx *AontuContext, spec *ValSpec) Val {
	out := NewVarVal(&ValSpec{Peg: v.peg}, ctx)
	if ctx != nil {
		out.path = ctx.path
	}
	copySite(&v.ValBase, &out.ValBase)
	return out
}

func (v *VarVal) Canon() string {
	return fmt.Sprintf("?%v", v.peg)
}

func (v *VarVal) Superior() Val { return top() }

// --- SpreadVal: spread constraints (&:{...}) ---

type SpreadVal struct {
	ValBase
}

func NewSpreadVal(spec *ValSpec, ctx *AontuContext) *SpreadVal {
	sv := &SpreadVal{ValBase: NewValBase(spec)}
	return sv
}

func (v *SpreadVal) IsSpread() bool  { return true }
func (v *SpreadVal) IsGenable() bool { return true }
func (v *SpreadVal) IsFeature() bool { return true }
func (v *SpreadVal) CJO() int        { return 110000 }

func (v *SpreadVal) Unify(peer Val, ctx *AontuContext) Val {
	if peer == nil {
		peer = top()
	}

	var out Val

	if peer.IsTop() {
		out = v
		out.SetDC(DONE)
	} else if peer.IsSpread() {
		// Merge two spreads
		pegVal, _ := v.peg.(Val)
		peerPegVal, _ := peer.GetPeg().(Val)
		if pegVal != nil && peerPegVal != nil {
			merged := unite(ctx, pegVal, peerPegVal, "spread-merge")
			out = NewSpreadVal(&ValSpec{Peg: merged}, ctx)
			if merged.Done() {
				out.SetDC(DONE)
			} else {
				out.SetDC(v.dc + 1)
			}
		} else {
			out = v
		}
	} else if peer.IsMap() {
		out = v.applyToMap(peer.(*MapVal), ctx)
	} else if peer.IsList() {
		out = v.applyToList(peer.(*ListVal), ctx)
	} else if peer.IsConjunct() {
		out = peer.Unify(v, ctx)
	} else {
		out = NewConjunctVal(&ValSpec{Peg: []Val{peer, v}}, ctx)
		out.SetDC(v.dc + 1)
	}

	// Track spread count
	if ctx.cc == 0 {
		if out.IsSpread() && !out.Done() {
			ctx.sc++
		}
	} else if ctx.sc > 0 {
		if !(out.IsSpread() && !out.Done()) {
			ctx.sc--
		}
	}

	return out
}

func (v *SpreadVal) applyToMap(m *MapVal, ctx *AontuContext) Val {
	spread, _ := v.peg.(Val)
	if spread == nil {
		return m
	}

	mapKeys := make([]string, 0)
	mp := m.PegMap()
	for k := range mp {
		mapKeys = append(mapKeys, k)
	}

	if len(mapKeys) == 0 {
		out := NewConjunctVal(&ValSpec{Peg: []Val{m, v}}, ctx)
		out.SetDC(DONE)
		return out
	}

	out := NewMapVal(&ValSpec{Peg: make(map[string]Val)}, ctx)
	out.closed = m.closed
	out.optionalKeys = append([]string{}, m.optionalKeys...)
	out.site = m.GetSite()

	done := true
	for _, key := range mapKeys {
		child := mp[key]
		keyctx := ctx.Descend(key)

		keySpread := spread.Clone(keyctx, nil)
		if keySpread == nil {
			keySpread = spread
		}
		if !keySpread.Done() {
			keySpread = unite(keyctx, keySpread, top(), "spread-resolve")
		}

		// Clear type marks on spread
		keySpread.GetMark().Type = false
		keySpread.GetMark().Hide = false

		propagateMarks(m, child)

		var oval Val
		if child == nil {
			oval = keySpread
		} else if child.IsNil() {
			oval = child
		} else if keySpread.IsNil() {
			oval = keySpread
		} else if keySpread.IsTop() && child.Done() {
			oval = child
		} else if child.IsTop() && keySpread.Done() {
			oval = keySpread
		} else {
			oval = unite(keyctx, child, keySpread, "spread-apply")
		}

		out.PegMap()[key] = oval
		done = done && (oval.GetDC() == DONE)
	}

	if done {
		out.dc = DONE
	} else {
		out.dc = m.dc + 1
	}
	propagateMarks(m, out)

	return out
}

func (v *SpreadVal) applyToList(l *ListVal, ctx *AontuContext) Val {
	spread, _ := v.peg.(Val)
	if spread == nil {
		return l
	}

	lp := l.PegList()
	if len(lp) == 0 {
		out := NewConjunctVal(&ValSpec{Peg: []Val{l, v}}, ctx)
		out.SetDC(DONE)
		return out
	}

	out := NewListVal(nil, ctx)
	out.closed = l.closed
	out.optionalKeys = append([]string{}, l.optionalKeys...)
	out.site = l.GetSite()

	done := true
	newPeg := make([]Val, len(lp))
	for i, child := range lp {
		key := fmt.Sprintf("%d", i)
		keyctx := ctx.Descend(key)
		keySpread := spread.SpreadClone(keyctx)

		propagateMarks(l, child)

		var oval Val
		if child == nil {
			oval = keySpread
		} else if child.IsNil() {
			oval = child
		} else if keySpread.IsNil() {
			oval = keySpread
		} else if keySpread.IsTop() && child.Done() {
			oval = child
		} else if child.IsTop() && keySpread.Done() {
			oval = keySpread
		} else {
			oval = unite(keyctx, child, keySpread, "spread-apply-list")
		}

		newPeg[i] = oval
		done = done && (oval.GetDC() == DONE)
	}

	out.peg = newPeg
	if done {
		out.dc = DONE
	} else {
		out.dc = l.dc + 1
	}
	propagateMarks(l, out)

	return out
}

func (v *SpreadVal) Gen(_ *AontuContext) (interface{}, error) {
	return nil, nil // unresolved spread generates nothing
}

func (v *SpreadVal) Clone(ctx *AontuContext, spec *ValSpec) Val {
	var pegClone interface{}
	if pegVal, ok := v.peg.(Val); ok {
		pegClone = pegVal.Clone(ctx, spec)
	} else {
		pegClone = v.peg
	}
	out := NewSpreadVal(&ValSpec{Peg: pegClone}, ctx)
	if v.Done() {
		out.dc = DONE
	}
	if ctx != nil {
		out.path = ctx.path
	}
	copySite(&v.ValBase, &out.ValBase)
	return out
}

func (v *SpreadVal) SpreadClone(ctx *AontuContext) Val {
	if !v.IsPathDependent() {
		return v
	}
	return v.Clone(ctx, nil)
}

func (v *SpreadVal) Canon() string {
	if pegVal, ok := v.peg.(Val); ok {
		pc := pegVal.Canon()
		if pegVal.IsMap() {
			return "{&:" + pc[1:len(pc)-1] + "}"
		}
		if pegVal.IsList() {
			return "[&:" + pc[1:len(pc)-1] + "]"
		}
		return "{&:" + pc + "}"
	}
	return "{&:}"
}

func (v *SpreadVal) Superior() Val { return top() }

// --- ExpectVal: expected value in spread context ---

type ExpectVal struct {
	ValBase
	peer   Val
	parent Val
	key    string
}

func NewExpectVal(spec *ValSpec, ctx *AontuContext) *ExpectVal {
	return &ExpectVal{ValBase: NewValBase(spec)}
}

func (v *ExpectVal) IsExpect() bool  { return true }
func (v *ExpectVal) IsFeature() bool { return true }

func (v *ExpectVal) Unify(peer Val, ctx *AontuContext) Val {
	if peer == nil {
		peer = top()
	}

	v.peer = peer

	pegVal, ok := v.peg.(Val)
	if ok && pegVal.IsGenable() {
		result := unite(ctx, pegVal, peer, "expect")
		return result
	}

	v.dc++
	return v
}

func (v *ExpectVal) Gen(_ *AontuContext) (interface{}, error) {
	return nil, &AontuError{Msg: "unresolved expected value"}
}

func (v *ExpectVal) Clone(ctx *AontuContext, spec *ValSpec) Val {
	out := NewExpectVal(&ValSpec{Peg: v.peg}, ctx)
	if ctx != nil {
		out.path = ctx.path
	}
	out.peer = v.peer
	out.parent = v.parent
	out.key = v.key
	copySite(&v.ValBase, &out.ValBase)
	return out
}

func (v *ExpectVal) Canon() string {
	if pegVal, ok := v.peg.(Val); ok {
		return "expect(" + pegVal.Canon() + ")"
	}
	return "expect()"
}

func (v *ExpectVal) Superior() Val { return top() }
