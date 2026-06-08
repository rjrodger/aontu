/* Copyright (c) 2025 Richard Rodger, MIT License */

package aontu

import "strings"

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
	for i, k := range m.keys {
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

// spreadCloneFor returns a per-key copy of the spread constraint (TOP
// needs no cloning).
func spreadCloneFor(s Val, path []string) Val {
	if isTop(s) {
		return s
	}
	return clonePath(s, path)
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
	if pm, ok := peer.(*MapVal); ok && !m.closed && pm.closed {
		return pm.Unify(m, ctx)
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
		} else if pm.spread != nil {
			out.spread = unite(ctx, out.spread, pm.spread)
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

	// Own children: each is unified with a fresh clone of the spread.
	for _, k := range m.keys {
		child := m.peg[k]
		cv := unite(ctx, child, spreadCloneFor(spreadCj, append(cp(m.path), k)))
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
				uv = unite(ctx, uv, spreadCloneFor(spreadCj, append(cp(m.path), pk)))
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
