/* Copyright (c) 2021-2025 Richard Rodger, MIT License */

package aontu

import (
	"fmt"
	"sort"
	"strings"
)

// BagVal is the abstract base for MapVal and ListVal.
type BagVal struct {
	ValBase
	closed       bool
	optionalKeys []string
}

func (v *BagVal) IsBag() bool     { return true }
func (v *BagVal) IsGenable() bool { return true }
func (v *BagVal) IsFeature() bool { return true }
func (v *BagVal) CJO() int        { return 10000 }

func (v *BagVal) isOptional(key string) bool {
	for _, k := range v.optionalKeys {
		if k == key {
			return true
		}
	}
	return false
}

// --- MapVal ---

// MapVal represents a key-value map.
// peg is map[string]Val
type MapVal struct {
	BagVal
	canonCache *string
	uh         []int // unification history
}

func NewMapVal(spec *ValSpec, ctx *AontuContext) *MapVal {
	mv := &MapVal{
		BagVal: BagVal{
			ValBase: NewValBase(spec),
		},
	}
	if spec != nil && spec.Peg != nil {
		mv.peg = spec.Peg
	} else {
		mv.peg = make(map[string]Val)
	}
	if spec != nil && spec.Mark != nil {
		mv.mark.Type = spec.Mark.Type
		mv.mark.Hide = spec.Mark.Hide
	}
	return mv
}

func (v *MapVal) IsMap() bool     { return true }
func (v *MapVal) IsBag() bool     { return true }
func (v *MapVal) IsGenable() bool { return true }
func (v *MapVal) IsFeature() bool { return true }
func (v *MapVal) CJO() int        { return 10000 }

// PegMap returns the peg as map[string]Val.
func (v *MapVal) PegMap() map[string]Val {
	m, ok := v.peg.(map[string]Val)
	if !ok {
		return nil
	}
	return m
}

func (v *MapVal) Unify(peer Val, ctx *AontuContext) Val {
	if peer == nil {
		peer = top()
	}

	out := &MapVal{
		BagVal: BagVal{
			ValBase:      NewValBase(nil),
			closed:       v.closed,
			optionalKeys: append([]string{}, v.optionalKeys...),
		},
	}
	out.peg = make(map[string]Val)
	out.site = v.GetSite()
	done := true

	thisPeg := v.PegMap()
	if thisPeg == nil {
		thisPeg = make(map[string]Val)
	}

	peerMap, isPeerMap := peer.(*MapVal)

	// Closure handling: if this is open and peer is closed, flip
	if isPeerMap && !v.closed && peerMap.closed {
		return peerMap.Unify(v, ctx)
	}

	// If peer is TOP, check fast path
	if peer.IsTop() {
		allDone := true
		for _, child := range thisPeg {
			if child != nil && child.GetDC() != DONE {
				allDone = false
				break
			}
		}
		if allDone {
			v.SetDC(DONE)
			return v
		}
	}

	out.dc = v.dc + 1

	// Unify own children with TOP
	for key, child := range thisPeg {
		keyctx := ctx.Descend(key)
		if child == nil {
			out.PegMap()[key] = top()
		} else {
			propagateMarks(v, child)
			if child.IsNil() {
				out.PegMap()[key] = child
			} else if child.Done() {
				out.PegMap()[key] = child
			} else {
				out.PegMap()[key] = unite(keyctx, child, top(), "map-own")
			}
		}
		done = done && (out.PegMap()[key].GetDC() == DONE)
	}

	// Unify with peer map
	if isPeerMap {
		peerPeg := peerMap.PegMap()
		if peerPeg == nil {
			peerPeg = make(map[string]Val)
		}

		// Merge optional keys from peer
		for _, k := range peerMap.optionalKeys {
			if !out.isOptional(k) {
				out.optionalKeys = append(out.optionalKeys, k)
			}
		}

		for peerkey, peerchild := range peerPeg {
			if peerchild == nil {
				continue
			}

			// Closed check
			if v.closed {
				if _, exists := out.PegMap()[peerkey]; !exists {
					return makeNilErr(ctx, "mapval_closed", v, peer)
				}
			}

			peerctx := ctx.Descend(peerkey)
			child, exists := out.PegMap()[peerkey]

			var oval Val
			if !exists || child == nil {
				oval = peerchild
			} else if child.IsTop() && peerchild.Done() {
				oval = peerchild
			} else if child.IsNil() {
				oval = child
			} else if peerchild.IsNil() {
				oval = peerchild
			} else {
				oval = unite(peerctx, child, peerchild, "map-peer")
			}

			propagateMarks(v, oval)
			out.PegMap()[peerkey] = oval
			done = done && (oval.GetDC() == DONE)
		}

		out.closed = out.closed || peerMap.closed
	} else if !peer.IsTop() {
		// Non-map peer (not TOP)
		return makeNilErr(ctx, "map", v, peer)
	}

	out.dc = DONE
	if !done {
		out.dc = v.dc + 1
	}

	propagateMarks(peer, out)
	propagateMarks(v, out)

	return out
}

func (v *MapVal) Gen(ctx *AontuContext) (interface{}, error) {
	if v.mark.Type || v.mark.Hide {
		return nil, nil
	}

	out := make(map[string]interface{})
	thisPeg := v.PegMap()

	for key, child := range thisPeg {
		if child == nil {
			continue
		}
		cm := child.GetMark()
		if cm.Type || cm.Hide {
			continue
		}

		cval, err := child.Gen(ctx)
		if err != nil {
			return nil, err
		}

		if cval == nil && v.isOptional(key) {
			continue
		}

		// NullVal generates nil — distinguish from "no value"
		if cval == nil && child.IsScalar() {
			out[key] = nil
		} else if cval != nil {
			out[key] = cval
		}
	}

	return out, nil
}

func (v *MapVal) Clone(ctx *AontuContext, spec *ValSpec) Val {
	out := NewMapVal(nil, ctx)
	out.peg = make(map[string]Val)
	if ctx != nil {
		out.path = ctx.path
	}
	out.closed = v.closed
	out.optionalKeys = append([]string{}, v.optionalKeys...)
	copySite(&v.ValBase, &out.ValBase)

	if spec != nil && spec.Mark != nil {
		out.mark.Type = spec.Mark.Type
		out.mark.Hide = spec.Mark.Hide
	} else {
		out.mark = v.mark
	}

	thisPeg := v.PegMap()
	for key, child := range thisPeg {
		if child != nil {
			childPath := append(append([]string{}, out.path...), key)
			out.PegMap()[key] = child.Clone(ctx, &ValSpec{
				Path: childPath,
				Mark: &ValMark{},
			})
		}
	}

	if v.Done() {
		out.dc = DONE
	}

	return out
}

func (v *MapVal) SpreadClone(ctx *AontuContext) Val {
	if !v.IsPathDependent() {
		return v
	}
	return v.Clone(ctx, nil)
}

func (v *MapVal) Canon() string {
	if v.canonCache != nil && v.Done() {
		return *v.canonCache
	}

	thisPeg := v.PegMap()
	keys := make([]string, 0, len(thisPeg))
	for k := range thisPeg {
		keys = append(keys, k)
	}
	sort.Strings(keys)

	parts := make([]string, 0, len(keys))
	for _, k := range keys {
		child := thisPeg[k]
		opt := ""
		if v.isOptional(k) {
			opt = "?"
		}
		canon := ""
		if child != nil {
			canon = child.Canon()
		}
		parts = append(parts, fmt.Sprintf("%s%s:%s", k, opt, canon))
	}

	result := "{" + strings.Join(parts, ",") + "}"

	if v.Done() {
		v.canonCache = &result
	}

	return result
}

func (v *MapVal) Superior() Val { return top() }

// --- ListVal ---

// ListVal represents an ordered list.
// peg is []Val
type ListVal struct {
	BagVal
	canonCache *string
	uh         []int
}

func NewListVal(spec *ValSpec, ctx *AontuContext) *ListVal {
	lv := &ListVal{
		BagVal: BagVal{
			ValBase: NewValBase(spec),
		},
	}
	if spec != nil && spec.Peg != nil {
		lv.peg = spec.Peg
	} else {
		lv.peg = []Val{}
	}
	return lv
}

func (v *ListVal) IsList() bool    { return true }
func (v *ListVal) IsBag() bool     { return true }
func (v *ListVal) IsGenable() bool { return true }
func (v *ListVal) IsFeature() bool { return true }
func (v *ListVal) CJO() int        { return 10000 }

// PegList returns the peg as []Val.
func (v *ListVal) PegList() []Val {
	l, ok := v.peg.([]Val)
	if !ok {
		return nil
	}
	return l
}

func (v *ListVal) Unify(peer Val, ctx *AontuContext) Val {
	if peer == nil {
		peer = top()
	}

	out := NewListVal(nil, ctx)
	out.peg = make([]Val, 0)
	out.closed = v.closed
	out.optionalKeys = append([]string{}, v.optionalKeys...)
	out.site = v.GetSite()
	done := true

	thisPeg := v.PegList()
	if thisPeg == nil {
		thisPeg = []Val{}
	}

	peerList, isPeerList := peer.(*ListVal)

	// Closure handling
	if isPeerList && !v.closed && peerList.closed {
		return peerList.Unify(v, ctx)
	}

	// Fast path for TOP
	if peer.IsTop() {
		allDone := true
		for _, child := range thisPeg {
			if child != nil && child.GetDC() != DONE {
				allDone = false
				break
			}
		}
		if allDone {
			v.SetDC(DONE)
			return v
		}
	}

	out.dc = v.dc + 1

	// Unify own children
	outList := make([]Val, len(thisPeg))
	for i, child := range thisPeg {
		key := fmt.Sprintf("%d", i)
		keyctx := ctx.Descend(key)
		if child == nil {
			outList[i] = top()
		} else {
			propagateMarks(v, child)
			if child.IsNil() {
				outList[i] = child
			} else if child.Done() {
				outList[i] = child
			} else {
				outList[i] = unite(keyctx, child, top(), "list-own")
			}
		}
		done = done && (outList[i].GetDC() == DONE)
	}

	// Unify with peer list
	if isPeerList {
		peerPeg := peerList.PegList()
		if peerPeg == nil {
			peerPeg = []Val{}
		}

		// Extend outList if peer is longer
		for len(outList) < len(peerPeg) {
			outList = append(outList, nil)
		}

		for i, peerchild := range peerPeg {
			if peerchild == nil {
				continue
			}
			key := fmt.Sprintf("%d", i)
			peerctx := ctx.Descend(key)

			var child Val
			if i < len(outList) {
				child = outList[i]
			}

			var oval Val
			if child == nil {
				oval = peerchild
			} else if child.IsTop() && peerchild.Done() {
				oval = peerchild
			} else if child.IsNil() {
				oval = child
			} else if peerchild.IsNil() {
				oval = peerchild
			} else {
				oval = unite(peerctx, child, peerchild, "list-peer")
			}

			propagateMarks(v, oval)
			outList[i] = oval
			done = done && (oval.GetDC() == DONE)
		}

		out.closed = out.closed || peerList.closed
	} else if !peer.IsTop() {
		return makeNilErr(ctx, "list", v, peer)
	}

	out.peg = outList

	out.dc = DONE
	if !done {
		out.dc = v.dc + 1
	}

	propagateMarks(peer, out)
	propagateMarks(v, out)

	return out
}

func (v *ListVal) Gen(ctx *AontuContext) (interface{}, error) {
	if v.mark.Type || v.mark.Hide {
		return nil, nil
	}

	thisPeg := v.PegList()
	out := make([]interface{}, 0, len(thisPeg))

	for _, child := range thisPeg {
		if child == nil {
			continue
		}
		cm := child.GetMark()
		if cm.Type || cm.Hide {
			continue
		}

		cval, err := child.Gen(ctx)
		if err != nil {
			return nil, err
		}
		out = append(out, cval)
	}

	return out, nil
}

func (v *ListVal) Clone(ctx *AontuContext, spec *ValSpec) Val {
	out := NewListVal(nil, ctx)
	if ctx != nil {
		out.path = ctx.path
	}
	out.closed = v.closed
	out.optionalKeys = append([]string{}, v.optionalKeys...)
	copySite(&v.ValBase, &out.ValBase)

	thisPeg := v.PegList()
	newPeg := make([]Val, len(thisPeg))
	for i, child := range thisPeg {
		if child != nil {
			newPeg[i] = child.Clone(ctx, &ValSpec{Mark: &ValMark{}})
		}
	}
	out.peg = newPeg

	if v.Done() {
		out.dc = DONE
	}

	return out
}

func (v *ListVal) SpreadClone(ctx *AontuContext) Val {
	if !v.IsPathDependent() {
		return v
	}
	return v.Clone(ctx, nil)
}

func (v *ListVal) Canon() string {
	if v.canonCache != nil && v.Done() {
		return *v.canonCache
	}

	thisPeg := v.PegList()
	parts := make([]string, 0, len(thisPeg))
	for _, child := range thisPeg {
		if child != nil {
			parts = append(parts, child.Canon())
		}
	}

	result := "[" + strings.Join(parts, ",") + "]"

	if v.Done() {
		v.canonCache = &result
	}

	return result
}

func (v *ListVal) Superior() Val { return top() }
