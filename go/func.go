/* Copyright (c) 2025 Richard Rodger, MIT License */

package aontu

import (
	"math"
	"strings"
)

// funcSet is the set of recognised built-in function names (mirrors the
// funcMap in ts/src/lang.ts).
var funcSet = map[string]bool{
	"upper": true, "lower": true, "copy": true, "key": true,
	"pref": true, "super": true, "type": true, "hide": true,
	"move": true, "path": true, "close": true, "open": true,
}

// FuncVal is a built-in function call (e.g. `upper(x)`). It follows the
// FuncBaseVal pattern (ts/src/val/FuncBaseVal.ts): operands are resolved
// to done, then resolve() computes the result; otherwise it defers.
type FuncVal struct {
	base
	name string
	peg  []Val // arguments
}

func newFunc(name string, args []Val) *FuncVal {
	return &FuncVal{name: name, peg: args}
}

func (f *FuncVal) superior() Val {
	if (f.name == "upper" || f.name == "lower") && len(f.peg) > 0 {
		if sv, ok := f.peg[0].(*ScalarVal); ok {
			return newScalarKind(sv.kind)
		}
	}
	return top()
}

func (f *FuncVal) Canon() string {
	parts := make([]string, len(f.peg))
	for i, a := range f.peg {
		parts[i] = a.Canon()
	}
	return f.name + "(" + strings.Join(parts, ",") + ")"
}

func (f *FuncVal) Gen(ctx *Ctx) (any, error) {
	return nil, &AontuError{Msg: "Cannot generate value: " + f.Canon()}
}

func (f *FuncVal) Unify(peer Val, ctx *Ctx) Val {
	if peer == nil {
		peer = top()
	}
	if Val(f) == peer {
		return f
	}

	// key() resolves late so that spreads/refs settle the path first
	// (KeyFuncVal.unify hack).
	if f.name == "key" && ctx.cc < 3 {
		f.notdone()
		switch {
		case isTop(peer):
			return clonePath(f, cp(f.path))
		case peer.Nil():
			return peer
		default:
			return newConjunct([]Val{f, peer})
		}
	}

	var out Val = f
	pegdone := true
	newpeg := make([]Val, 0, len(f.peg))
	for _, arg := range f.peg {
		na := arg
		if arg.Dc() != DONE {
			na = unite(ctx, arg, top())
		}
		if na.Dc() != DONE {
			pegdone = false
		}
		newpeg = append(newpeg, na)
	}
	f.peg = newpeg

	if pegdone {
		result := f.resolve(ctx, newpeg)
		if result == nil {
			result = f
		}
		if _, ok := result.(*FuncVal); ok {
			switch {
			case isTop(peer):
				out = f
			case peer.Nil():
				out = makeNilErr(ctx, "func", f, peer)
			case f.Canon() == peer.Canon():
				out = f
			default:
				out = newConjunct([]Val{f, peer})
			}
		} else if result.Dc() == DONE && isTop(peer) {
			out = result
		} else {
			out = unite(ctx, result, peer)
		}
	} else if isTop(peer) {
		f.notdone()
		out = newFunc(f.name, newpeg)
		out.(*FuncVal).path = cp(f.path)
		out.(*FuncVal).dc = f.dc
	} else if peer.Nil() {
		f.notdone()
		out = peer
	} else {
		f.notdone()
		out = newConjunct([]Val{f, peer})
	}

	if out.Dc() != DONE {
		out.setDc(f.dc + 1)
	}
	return out
}

// resolve dispatches to the named function's implementation.
func (f *FuncVal) resolve(ctx *Ctx, args []Val) Val {
	switch f.name {
	case "upper":
		return upperLower(ctx, args, true)
	case "lower":
		return upperLower(ctx, args, false)
	case "copy":
		if len(args) == 0 {
			return makeNilErr(ctx, "invalid-arg", f, nil)
		}
		return clonePath(args[0], cp(f.path))
	case "key":
		return keyFunc(f)
	case "pref":
		if len(args) == 0 {
			return makeNilErr(ctx, "arg", f, nil)
		}
		return walkPref(clonePath(args[0], cp(f.path)))
	case "super":
		return f.superior()
	}
	return makeNilErr(ctx, "func:"+f.name, f, nil)
}

func upperLower(ctx *Ctx, args []Val, up bool) Val {
	if len(args) == 0 {
		return makeNilErr(ctx, "arg", nil, nil)
	}
	sv, ok := args[0].(*ScalarVal)
	if !ok {
		return makeNilErr(ctx, "invalid-arg", args[0], nil)
	}
	switch sv.kind {
	case KindString:
		s := sv.peg.(string)
		if up {
			return newString(strings.ToUpper(s))
		}
		return newString(strings.ToLower(s))
	case KindInteger, KindNumber:
		var fv float64
		if sv.kind == KindInteger {
			fv = float64(sv.peg.(int64))
		} else {
			fv = sv.peg.(float64)
		}
		if up {
			return newNumber(math.Ceil(fv))
		}
		return newNumber(math.Floor(fv))
	}
	return makeNilErr(ctx, "invalid-arg", args[0], nil)
}

// keyFunc returns the key `move` levels up the path (KeyFuncVal.resolve).
func keyFunc(f *FuncVal) Val {
	move := 1
	if len(f.peg) > 0 {
		if sv, ok := f.peg[0].(*ScalarVal); ok && sv.kind == KindInteger {
			move = int(sv.peg.(int64))
		}
	}
	idx := len(f.path) - (1 + move)
	key := ""
	if idx >= 0 && idx < len(f.path) {
		key = f.path[idx]
	}
	return newString(key)
}

// walkPref wraps every scalar/pref leaf in a PrefVal (PrefFuncVal.resolve).
func walkPref(v Val) Val {
	switch n := v.(type) {
	case *ScalarVal:
		return newPref(n)
	case *PrefVal:
		return newPref(n)
	case *MapVal:
		for _, k := range n.keys {
			n.peg[k] = walkPref(n.peg[k])
		}
		return n
	case *ListVal:
		for i := range n.peg {
			n.peg[i] = walkPref(n.peg[i])
		}
		return n
	}
	return v
}
