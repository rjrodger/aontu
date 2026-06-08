/* Copyright (c) 2025 Richard Rodger, MIT License */

package aontu

import "strings"

// MapVal is an ordered map of string keys to child Vals. Insertion
// order is preserved for canon output and generation.
type MapVal struct {
	base
	keys   []string
	peg    map[string]Val
	closed bool // close() — no keys beyond those present may be added
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
		cv, err := child.Gen(ctx)
		if err != nil {
			return nil, err
		}
		out[k] = cv
	}
	return out, nil
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
	done := true

	// Unify own children towards TOP first (drives convergence).
	for _, k := range m.keys {
		cv := unite(ctx, m.peg[k], top())
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
			if ex, ok := out.peg[pk]; ok {
				uv := unite(ctx, ex, pc)
				out.set(pk, uv)
				if uv.Dc() != DONE {
					done = false
				}
			} else {
				uv := unite(ctx, pc, top())
				out.set(pk, uv)
				if uv.Dc() != DONE {
					done = false
				}
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
	return out
}
