/* Copyright (c) 2025 Richard Rodger, MIT License */

package aontu

import (
	"sort"
	"strings"
)

// MapVal is an ordered map of string keys to child Vals. Insertion
// order is preserved for canon output and generation.
type MapVal struct {
	base
	keys     []string
	peg      map[string]Val
	closed   bool     // close() — no keys beyond those present may be added
	spread   Val      // &: spread constraint applied to every key (nil if none)
	optional []string // keys marked optional (a?:1) — dropped if unresolved
}

func (m *MapVal) isOptional(k string) bool {
	for _, o := range m.optional {
		if o == k {
			return true
		}
	}
	return false
}

func newMap() *MapVal {
	return &MapVal{peg: map[string]Val{}}
}

// set assigns a key, preserving insertion order for new keys.
func (m *MapVal) set(k string, v Val) {
	if _, ok := m.peg[k]; !ok {
		m.keys = append(m.keys, k)
	}
	m.peg[k] = v
}

// add applies duplicate-key merge semantics: a repeated key combines
// the old and new values into a conjunct, mirroring the jsonic merge
// in ts/src/lang.ts (so `a:1 a:2` becomes `a:1&2`).
func (m *MapVal) add(k string, v Val) {
	if old, ok := m.peg[k]; ok {
		m.peg[k] = mergeVals(old, v)
	} else {
		m.keys = append(m.keys, k)
		m.peg[k] = v
	}
}

func mergeVals(a, b Val) Val {
	if cj, ok := a.(*ConjunctVal); ok {
		cj.peg = append(cj.peg, b)
		return cj
	}
	return newConjunct([]Val{a, b})
}

func (m *MapVal) superior() Val { return top() }

func (m *MapVal) Canon() string {
	var b strings.Builder
	b.WriteByte('{')
	if m.spread != nil {
		b.WriteString("&:")
		b.WriteString(m.spread.Canon())
		if len(m.keys) > 0 {
			b.WriteByte(',')
		}
	}
	// Keys are emitted alphabetically so the canonical form is independent
	// of insertion/unification order (matching the TypeScript canon and the
	// JSON marshaling, which also sorts keys). A copy is sorted so the
	// internal m.keys order — used by the determinism driver in Unify —
	// is left untouched.
	keys := append([]string(nil), m.keys...)
	sort.Strings(keys)
	for i, k := range keys {
		if i > 0 {
			b.WriteByte(',')
		}
		b.WriteString(jsonString(k))
		b.WriteByte(':')
		b.WriteString(m.peg[k].Canon())
	}
	b.WriteByte('}')
	return b.String()
}

// unwrapTypeSpread maps a type() used as a spread to its inner template:
// the spread should emit constrained values at each destination, not mark
// the destination as a type. The func's argument (peg[0]) is the
// parse-time template, so any key()/path() inside is still structural and
// will resolve at the destination (via spreadCloneFor's clonePath). A ref
// to a type() is resolved to the same template, so a type-wrapped ref
// spread behaves like a plain-map ref spread.
func unwrapTypeSpread(s Val, ctx *Ctx) Val {
	if rv, ok := s.(*RefVal); ok {
		if ctx.typeSnap != nil {
			if snap, ok := ctx.typeSnap[rv]; ok {
				return snap
			}
		}
		tgt := rv.find(ctx)
		if fv, ok := tgt.(*FuncVal); ok && fv.name == "type" && len(fv.peg) > 0 {
			inner := fv.peg[0]
			// Cache the inner template only while it is still structural
			// (key()/path() unresolved). The func's arg mutates as the
			// source resolves across fixpoint passes, so caching the first
			// path-dependent form avoids re-reading the source-resolved
			// value (which would leak the source key into the destination).
			if hasPathFunc(inner) {
				if ctx.typeSnap == nil {
					ctx.typeSnap = map[*RefVal]Val{}
				}
				ctx.typeSnap[rv] = inner
			}
			return inner
		}
		return s
	}
	if fv, ok := s.(*FuncVal); ok && fv.name == "type" && len(fv.peg) > 0 {
		return fv.peg[0]
	}
	return s
}

// hasPathFunc reports whether v contains an unresolved path-dependent
// function (key/path/move/super) or a ref, anywhere in its structure.
func hasPathFunc(v Val) bool {
	switch n := v.(type) {
	case *FuncVal:
		switch n.name {
		case "key", "path", "move", "super":
			return true
		}
		for _, a := range n.peg {
			if hasPathFunc(a) {
				return true
			}
		}
	case *RefVal:
		return true
	case *MapVal:
		if n.spread != nil && hasPathFunc(n.spread) {
			return true
		}
		for _, k := range n.keys {
			if hasPathFunc(n.peg[k]) {
				return true
			}
		}
	case *ListVal:
		for _, e := range n.peg {
			if hasPathFunc(e) {
				return true
			}
		}
	case *ConjunctVal:
		for _, t := range n.peg {
			if hasPathFunc(t) {
				return true
			}
		}
	case *DisjunctVal:
		for _, t := range n.peg {
			if hasPathFunc(t) {
				return true
			}
		}
	case *PrefVal:
		return hasPathFunc(n.peg)
	}
	return false
}

// spreadCloneFor returns a per-key copy of the spread constraint (TOP
// needs no cloning), resolved at the destination and with constraint
// marks cleared.
func spreadCloneFor(s Val, path []string, ctx *Ctx) Val {
	if isTop(s) {
		return s
	}
	c := clonePath(s, path)
	// Resolve the spread (e.g. a ref or a path-dependent func) at the
	// destination first, THEN clear marks on the resolved root and its
	// direct children: a type()/hide() spread constrains values but must
	// not make the destination type-/gen-invisible (mirrors
	// SpreadVal.applyToMap in perf0 and the TS spread handling).
	if c.Dc() != DONE {
		c = unite(ctx, c, top())
	}
	// Clear TYPE marks on the whole resolved clone (recursively): a type()
	// spread constrains values but must not make the destination — at any
	// depth — type-invisible (clearing only direct children leaves nested
	// marks like `type({m:{x:number}})` intact, silently dropping them).
	// HIDE marks are preserved: a hide() spread (`&:{h:hide(1)}`) is meant
	// to hide the spread field at the destination.
	walkMark(c, true, false, false, false)
	return c
}

func (m *MapVal) Gen(ctx *Ctx) (any, error) {
	if m.mtype || m.mhide {
		return nil, nil
	}
	out := map[string]any{}
	for _, k := range m.keys {
		child := m.peg[k]
		// Type and hidden values are excluded from generation.
		if child.markedType() || child.markedHide() {
			continue
		}
		// A key whose source was moved away is hidden.
		if ctx != nil && ctx.isHidden(append(cp(m.path), k)) {
			continue
		}
		optional := m.isOptional(k)
		cv, err := child.Gen(ctx)
		if err != nil {
			// An optional key that does not resolve is dropped, not an error.
			if optional {
				continue
			}
			return nil, err
		}
		if optional && (cv == nil || isEmptyGen(cv)) {
			continue
		}
		out[k] = cv
	}
	return out, nil
}

// isEmptyGen reports whether a generated value is an empty map or list.
func isEmptyGen(v any) bool {
	switch n := v.(type) {
	case map[string]any:
		return len(n) == 0
	case []any:
		return len(n) == 0
	}
	return false
}

func (m *MapVal) Unify(peer Val, ctx *Ctx) Val {
	if peer == nil {
		peer = top()
	}
	// Let the closed side drive, so its key restriction is enforced
	// deterministically (mirrors MapVal.unify).
	if pm, ok := peer.(*MapVal); ok {
		if !m.closed && pm.closed {
			return pm.Unify(m, ctx)
		}
		// Both closed: pick a deterministic driver (fewer keys, then
		// lexicographic key order) so the result is independent of
		// operand order (mirrors ts/src/val/MapVal.ts).
		if m.closed && pm.closed {
			if len(pm.keys) < len(m.keys) ||
				(len(pm.keys) == len(m.keys) &&
					strings.Join(pm.keys, "~") < strings.Join(m.keys, "~")) {
				return pm.Unify(m, ctx)
			}
		}
	}
	out := newMap()
	out.closed = m.closed
	out.path = cp(m.path)
	out.spread = m.spread
	out.optional = append([]string{}, m.optional...)
	done := true

	// Combine spreads and optional keys (additive) from both sides.
	if pm, ok := peer.(*MapVal); ok {
		if out.spread == nil {
			out.spread = pm.spread
		} else if pm.spread != nil && out.spread.Canon() != pm.spread.Canon() {
			// Combine two distinct spread constraints structurally (deferred
			// via a conjunct) rather than unifying in place. A spread is a
			// template applied per destination key; unifying here resolves
			// its key()/path() at the template's own (intermediate) path,
			// producing spurious values. Identical templates (same canon)
			// collapse to one — otherwise the conjunct grows every fixpoint
			// pass (unbounded) since the spread re-combines each pass.
			out.spread = newConjunct([]Val{out.spread, pm.spread})
		}
		for _, ok := range pm.optional {
			if !out.isOptional(ok) {
				out.optional = append(out.optional, ok)
			}
		}
	}
	var spreadCj Val = top()
	if out.spread != nil {
		spreadCj = out.spread
	}
	spreadCj = unwrapTypeSpread(spreadCj, ctx)

	// Own children: each is unified with a fresh clone of the spread.
	for _, k := range m.keys {
		child := m.peg[k]
		cv := unite(ctx, child, spreadCloneFor(spreadCj, append(cp(m.path), k), ctx))
		out.set(k, cv)
		if cv.Dc() != DONE {
			done = false
		}
	}

	if pm, ok := peer.(*MapVal); ok {
		out.closed = m.closed || pm.closed
		for _, pk := range pm.keys {
			pc := pm.peg[pk]
			if _, allowed := m.peg[pk]; m.closed && !allowed {
				return makeNilErr(ctx, "closed", pc, nil)
			}
			var uv Val
			if ex, ok := out.peg[pk]; ok {
				uv = unite(ctx, ex, pc)
			} else {
				uv = unite(ctx, pc, top())
			}
			// A spread on the receiving map also applies to peer keys.
			if m.spread != nil {
				uv = unite(ctx, uv, spreadCloneFor(spreadCj, append(cp(m.path), pk), ctx))
			}
			out.set(pk, uv)
			if uv.Dc() != DONE {
				done = false
			}
		}
	} else if !isTop(peer) {
		return makeNilErr(ctx, "map", m, peer)
	}

	if done {
		out.setDc(DONE)
	} else {
		out.setDc(m.dc + 1)
	}
	// Marks on the map itself survive unification.
	propagateMarks(m, out)
	if !isTop(peer) {
		propagateMarks(peer, out)
	}
	return out
}
