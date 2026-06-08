/* Copyright (c) 2025 Richard Rodger, MIT License */

package aontu

import (
	"strconv"
	"strings"
)

// RefVal is a path reference (e.g. `$.a.b`, `.x.a`, `x.a`). It resolves
// against the root during the fixpoint unification loop. Ported from
// ts/src/val/RefVal.ts.
type RefVal struct {
	base
	peg      []any // path parts: string or *VarVal
	absolute bool
	prefix   bool
}

func newRef(terms []any, prefix bool) *RefVal {
	rv := &RefVal{prefix: prefix}
	for _, t := range terms {
		rv.append(t)
	}
	return rv
}

func (rv *RefVal) cjo() int      { return 32500 }
func (rv *RefVal) superior() Val { return top() }

// append builds the path parts, mirroring RefVal.append.
func (rv *RefVal) append(part any) {
	switch p := part.(type) {
	case string:
		rv.peg = append(rv.peg, p)
	case float64:
		rv.peg = append(rv.peg, numStr(p))
	case *ScalarVal:
		switch p.kind {
		case KindString:
			rv.peg = append(rv.peg, p.peg.(string))
		case KindInteger:
			rv.peg = append(rv.peg, strconv.FormatInt(p.peg.(int64), 10))
		case KindNumber:
			for _, s := range strings.Split(formatNumber(p.peg.(float64)), ".") {
				rv.peg = append(rv.peg, s)
			}
		}
	case *VarVal:
		rv.peg = append(rv.peg, p)
	case *RefVal:
		if p.absolute {
			rv.absolute = true
		}
		if rv.prefix {
			if p.prefix {
				rv.peg = append(rv.peg, ".")
			}
		} else if p.prefix {
			if len(rv.peg) == 0 {
				rv.prefix = true
			} else {
				rv.peg = append(rv.peg, ".")
			}
		}
		rv.peg = append(rv.peg, p.peg...)
	}
}

func numStr(f float64) string {
	if f == float64(int64(f)) {
		return strconv.FormatInt(int64(f), 10)
	}
	return formatNumber(f)
}

func (rv *RefVal) Unify(peer Val, ctx *Ctx) Val {
	if peer == nil {
		peer = top()
	}
	if Val(rv) == peer {
		return rv
	}

	var out Val
	found := rv.find(ctx)
	if found == nil {
		// Not yet resolved: defer.
		switch {
		case isTop(peer):
			out = rv
		case peer.Nil():
			out = makeNilErr(ctx, "ref", rv, peer)
		case rv.Canon() == peer.Canon():
			out = rv
		default:
			out = newConjunct([]Val{rv, peer})
		}
	} else {
		out = unite(ctx, found, peer)
	}

	if out.Dc() != DONE {
		out.setDc(rv.dc + 1)
	}
	return out
}

// find resolves the reference against ctx.root. It returns the cloned
// target, a NilVal (path not found / cycle), or nil when resolution
// must be retried on a later pass.
func (rv *RefVal) find(ctx *Ctx) Val {
	if rv.isPrefixPath() {
		return makeNilErr(ctx, "path_cycle", rv, nil)
	}

	parts := make([]string, 0, len(rv.peg))
	var modes []string
	for i, p := range rv.peg {
		if vv, ok := p.(*VarVal); ok {
			switch name := varName(vv); name {
			case "KEY":
				if i != len(rv.peg)-1 {
					return nil
				}
				modes = append(modes, "KEY")
			case "SELF":
				if i != 0 {
					return nil
				}
				modes = append(modes, "SELF")
			case "PARENT":
				if i != 0 {
					return nil
				}
				modes = append(modes, "PARENT")
			default:
				// Generic variable lookup is not yet supported.
				return nil
			}
			continue
		}
		s, ok := p.(string)
		if !ok {
			return nil
		}
		parts = append(parts, s)
	}

	// $KEY resolves to the enclosing key (the path segment above this node).
	if containsStr(modes, "KEY") {
		key := ""
		if len(rv.path) >= 2 {
			key = rv.path[len(rv.path)-2]
		}
		return newString(key)
	}

	var refpath []string
	if rv.absolute {
		refpath = parts
	} else {
		end := len(rv.path) - 1
		if containsStr(modes, "SELF") {
			end = 0
		}
		if end < 0 {
			end = 0
		}
		base := append([]string{}, rv.path[:end]...)
		refpath = append(base, parts...)
	}
	refpath = reduceDots(refpath)

	var node Val = ctx.root
	for _, part := range refpath {
		switch n := node.(type) {
		case *MapVal:
			node = n.peg[part]
		case *ListVal:
			idx, err := strconv.Atoi(part)
			if err != nil || idx < 0 || idx >= len(n.peg) {
				node = nil
			} else {
				node = n.peg[idx]
			}
		default:
			if node.Dc() == DONE {
				return makeNilErr(ctx, "no_path", rv, nil)
			}
			return nil
		}
		if node == nil {
			return makeNilErr(ctx, "no_path", rv, nil)
		}
	}

	return clonePath(node, cp(rv.path))
}

// isPrefixPath reports whether the reference path is a prefix of this
// node's own path (a self/ancestor cycle).
func (rv *RefVal) isPrefixPath() bool {
	if len(rv.peg) == 0 || len(rv.peg) > len(rv.path) {
		return false
	}
	for i, p := range rv.peg {
		s, ok := p.(string)
		if !ok || s != rv.path[i] {
			return false
		}
	}
	return true
}

func varName(vv *VarVal) string {
	switch p := vv.peg.(type) {
	case string:
		return p
	case *ScalarVal:
		if p.kind == KindString {
			return p.peg.(string)
		}
	}
	return ""
}

func containsStr(ss []string, s string) bool {
	for _, x := range ss {
		if x == s {
			return true
		}
	}
	return false
}

// reduceDots collapses parent-navigation markers (".").
func reduceDots(path []string) []string {
	out := make([]string, 0, len(path))
	for _, p := range path {
		if p == "." {
			if len(out) > 0 {
				out = out[:len(out)-1]
			}
		} else {
			out = append(out, p)
		}
	}
	return out
}

func (rv *RefVal) Canon() string {
	var b strings.Builder
	if rv.absolute {
		b.WriteByte('$')
	}
	if len(rv.peg) > 0 {
		b.WriteByte('.')
	}
	parts := make([]string, len(rv.peg))
	for i, p := range rv.peg {
		switch pp := p.(type) {
		case string:
			if pp == "." {
				parts[i] = ""
			} else {
				parts[i] = pp
			}
		case Val:
			parts[i] = pp.Canon()
		}
	}
	b.WriteString(strings.Join(parts, "."))
	return b.String()
}

func (rv *RefVal) Gen(ctx *Ctx) (any, error) {
	return nil, &AontuError{Msg: "Cannot generate value: " + rv.Canon()}
}

// VarVal is a variable reference (e.g. `$name`). Full variable lookup
// is ported later; for now it resolves only via RefVal special names.
type VarVal struct {
	base
	peg any // variable name (string) or a Val
}

func newVar(name any) *VarVal { return &VarVal{peg: name} }

func (vv *VarVal) superior() Val { return top() }

func (vv *VarVal) Canon() string {
	if v, ok := vv.peg.(Val); ok {
		return "$" + v.Canon()
	}
	if s, ok := vv.peg.(string); ok {
		return "$" + s
	}
	return "$"
}

func (vv *VarVal) Unify(peer Val, ctx *Ctx) Val {
	return makeNilErr(ctx, "unknown_var", vv, peer)
}

func (vv *VarVal) Gen(ctx *Ctx) (any, error) {
	return nil, &AontuError{Msg: "Cannot generate value: " + vv.Canon()}
}
