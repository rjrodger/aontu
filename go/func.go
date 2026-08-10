/* Copyright (c) 2025 Richard Rodger, MIT License */

package aontu

import (
	"math"
	"sort"
	"strings"
)

// funcSet is the set of recognised built-in function names (mirrors the
// funcMap in ts/src/lang.ts).
var funcSet = map[string]bool{
	"upper": true, "lower": true, "copy": true, "key": true,
	"pref": true, "super": true, "type": true, "hide": true,
	"move": true, "path": true, "close": true, "open": true,
}

// BuiltinFuncNames returns the recognised built-in function names in
// sorted order. Exposed for tooling (e.g. LSP completion in go/lsp).
func BuiltinFuncNames() []string {
	names := make([]string, 0, len(funcSet))
	for n := range funcSet {
		names = append(names, n)
	}
	sort.Strings(names)
	return names
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
	// Silent (mirrors KeyFuncVal.gen and the FuncBaseVal pattern in
	// TS): the enclosing bag reports unresolved funcs.
	return nil, nil
}

func (f *FuncVal) Unify(peer Val, ctx *Ctx) Val {
	if peer == nil {
		peer = top()
	}
	if Val(f) == peer {
		return f
	}

	// The location this func is being driven at (the TS ctx.path): the
	// caller's slot hint when present, else the func's own stored path
	// — identical except for shared/transplanted clones, whose stored
	// paths carry overlay tails that the driving ctx does not.
	base := ctx.slot
	if base == nil {
		base = f.path
	}

	// key() resolves late so that spreads/refs settle the path first
	// (KeyFuncVal.unify hack).
	if f.name == "key" && ctx.cc < 3 {
		f.notdone()
		switch {
		case isTop(peer):
			// The delay clone re-paths via the driving ctx (TS
			// `this.clone(ctx)` — overlay of the stored path on ctx.path).
			return clonePath(f, overlayPath(base, f.path))
		case peer.Nil():
			return peer
		default:
			// Identical key() at the same path collapses (the
			// peer.isKeyFunc same-path same-arg check in TS
			// KeyFuncVal.unify): `key()&key()` folds to one pending
			// key() during the delay window.
			if pf, ok := peer.(*FuncVal); ok && pf.name == "key" &&
				pathEq(pf.path, f.path) && keyArgEq(pf, f) {
				return f
			}
			return newConjunct([]Val{f, peer})
		}
	}

	// A marked func freezes against TOP instead of resolving (the
	// `peer.isTop && (mark.type || mark.hide) -> dc = DONE` shortcut in
	// TS FuncBaseVal.unify). The hide mark arrives either directly
	// (hide()/type() marks, the move() hide-found mark on the source
	// root) or via the bag mark ratchet pushing a parent's mark down
	// one level per pass. A frozen func still RESOLVES against a
	// non-TOP peer (e.g. a spread clone applied to a hidden child) —
	// the freeze is TOP-only, exactly as in TS.
	if isTop(peer) && (f.mtype || f.mhide) {
		f.setDc(DONE)
		return f
	}

	// Re-path args to this func's location before resolving them: func
	// clones share their args with the source (see clonePath), and in
	// TS the driving ctx re-descends the shared tree at the
	// destination's path each pass. The Go port keeps paths on the
	// Vals, so the driver re-paths in place — last driver wins, as in
	// TS. The overlay semantics (see repathArg) preserve path tails
	// beyond the driving base, exactly like ctx-based Val.clone.
	if f.name != "move" && f.name != "copy" {
		for _, arg := range f.peg {
			repathArg(arg, base, ctx.cc)
		}
	}

	// Resolve operands into a scratch slice WITHOUT writing them back:
	// a stuck func keeps its original operands in canon (mirrors TS
	// FuncBaseVal/OpBaseVal, which only pass resolved args to resolve).
	var out Val = f
	pegdone := true
	newpeg := make([]Val, 0, len(f.peg))
	newtype := f.mtype
	newhide := f.mhide
	// move() and copy() operate on raw arguments (they must not be
	// resolved first), mirroring MoveFuncVal.prepare and
	// CopyFuncVal.prepare returning null in TS — copy(expr) clones the
	// raw expression immediately and the clone resolves at the
	// destination.
	if f.name == "move" || f.name == "copy" {
		newpeg = f.peg
	} else {
		for _, arg := range f.peg {
			na := arg
			if arg.Dc() != DONE {
				// Args are driven at the func's location (TS drives them
				// with the func's own ctx, undescended).
				ctx.slot = base
				na = unite(ctx, arg, top())
				// Marks surfacing on resolved args infect the rebuilt
				// pending func (the newtype/newhide accumulation in TS
				// FuncBaseVal.unify).
				newtype = newtype || na.markedType()
				newhide = newhide || na.markedHide()
			}
			if na.Dc() != DONE {
				pegdone = false
			}
			newpeg = append(newpeg, na)
		}
	}

	if pegdone {
		result := f.resolve(ctx, base, newpeg)
		if result == nil {
			result = f
		}
		// Only the func ITSELF signals "still pending" — a resolve that
		// returns a *different* func (copy of a raw func argument)
		// produced a real value that must unify onward.
		if result == Val(f) {
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
			ctx.slot = base
			out = unite(ctx, result, peer)
		}
		// The func's marks survive onto its resolution (the
		// propagateMarks(this, out) in TS FuncBaseVal.unify) — e.g. a
		// hide-marked pending func that resolves against a spread peer
		// yields a hidden value. TS also assigns the func's own path to
		// the result (`out.path = this.path`), so a copy()/move() clone
		// delivered through a transplanted func lands at the func's
		// location rather than keeping a stale overlay-tailed path.
		if out != Val(f) && !isTop(out) {
			propagateMarks(f, out)
			out.setvpath(cp(f.path))
		}
	} else if isTop(peer) {
		f.notdone()
		nf := newFunc(f.name, newpeg)
		nf.path = cp(f.path)
		nf.dc = f.dc
		nf.sp = f.sp
		nf.spr = f.spr
		nf.mtype = newtype
		nf.mhide = newhide
		out = nf
	} else if peer.Nil() {
		f.notdone()
		out = peer
	} else {
		f.notdone()
		cj := newConjunct([]Val{f, peer})
		cj.path = cp(f.path) // TS defer branch: out.path = this.path
		out = cj
	}

	if out.Dc() != DONE {
		out.setDc(f.dc + 1)
	}
	return out
}

// pathEq reports whether two paths are identical.
func pathEq(a, b []string) bool {
	if len(a) != len(b) {
		return false
	}
	for i := range a {
		if a[i] != b[i] {
			return false
		}
	}
	return true
}

// keyArgEq reports whether two key() funcs have the same move-count
// argument (mirrors the `peer.peg?.[0]?.peg === this.peg?.[0]?.peg`
// check in TS KeyFuncVal.unify).
func keyArgEq(a, b *FuncVal) bool {
	av, aok := keyArgVal(a)
	bv, bok := keyArgVal(b)
	return aok == bok && av == bv
}

func keyArgVal(f *FuncVal) (int64, bool) {
	if len(f.peg) > 0 {
		if sv, ok := f.peg[0].(*ScalarVal); ok && sv.kind == KindInteger {
			return sv.peg.(int64), true
		}
	}
	return 0, false
}

// resolve dispatches to the named function's implementation. base is
// the location the func is being driven at (see Unify) — resolution
// clones re-path to it, mirroring the ctx-path clones in TS.
func (f *FuncVal) resolve(ctx *Ctx, base []string, args []Val) Val {
	switch f.name {
	case "upper":
		return upperLower(ctx, args, true)
	case "lower":
		return upperLower(ctx, args, false)
	case "copy":
		if len(args) == 0 {
			return makeNilErr(ctx, "invalid-arg", f, nil)
		}
		// Raw-ref argument: the target may not exist yet, so defer the
		// mark clearing to resolution via the copyFound flag. The clone
		// is re-pathed to the copy()'s own location (the ctx-path clone
		// in TS), since a shared raw arg may carry a stale path.
		if rv, ok := args[0].(*RefVal); ok {
			src := clonePath(rv, cp(base)).(*RefVal)
			src.copyFound = true
			return src
		}
		out := clonePath(args[0], cp(base))
		walkMark(out, true, false, true, false) // copy clears marks
		return out
	case "key":
		return keyFunc(f)
	case "pref":
		if len(args) == 0 {
			return makeNilErr(ctx, "arg", f, nil)
		}
		return walkPref(clonePath(args[0], cp(base)))
	case "type":
		if len(args) == 0 {
			return makeNilErr(ctx, "arg", f, nil)
		}
		out := clonePath(args[0], cp(base))
		walkMark(out, true, true, false, false)
		return out
	case "hide":
		if len(args) == 0 {
			return makeNilErr(ctx, "arg", f, nil)
		}
		out := clonePath(args[0], cp(base))
		walkMark(out, false, false, true, true)
		return out
	case "close":
		return setClosed(ctx, f, args, true)
	case "open":
		return setClosed(ctx, f, args, false)
	case "path":
		// path(x.a) / path($.a.b): the argument is (or resolves via) a
		// reference; return the resolved value.
		if len(args) == 0 {
			return makeNilErr(ctx, "arg", f, nil)
		}
		return args[0]
	case "super":
		// super(x) is the lattice-superior of its ARGUMENT, not of the
		// super() call itself: super(1) -> integer, super(1.5) ->
		// float, super(a) -> string, super(true) -> boolean.
		// Returning the func's own superior (top) is what made super()
		// inert.
		if len(args) > 0 && args[0] != nil {
			// A kind argument climbs the KIND lattice — super(integer)
			// and super(float) are `number`, super(number) is top.
			// ScalarKindVal.superior() cannot answer this: it is also
			// PrefVal's narrowing gate and must stay top there.
			if kv, ok := args[0].(*ScalarKindVal); ok {
				if p, has := kindParent(kv.kind); has {
					return newScalarKind(p)
				}
				return f.superior()
			}
			if sup := args[0].superior(); sup != nil && !isTop(sup) {
				// Where the argument has no meaningful superior,
				// superior() answers top and we fall through to the
				// previous behaviour.
				return sup
			}
		}
		return f.superior()
	case "move":
		// Move the referenced value here, hiding it at the source. The
		// moved copy always arrives behind a pref() func (exactly the
		// PrefFuncVal wrap in TS MoveFuncVal.resolve), so the pref walk
		// runs on the RESOLVED value. A ref argument carries the
		// hide-found flag so resolution hides the source node in place.
		if len(args) == 0 {
			return makeNilErr(ctx, "arg", f, nil)
		}
		src := clonePath(args[0], cp(base))
		if rv, ok := src.(*RefVal); ok {
			rv.hideFound = true
		}
		// Hide the raw argument in place (the walk(orig, mark.hide) in
		// TS MoveFuncVal.resolve): for a literal argument the arg IS
		// the source being moved away.
		walkMark(args[0], false, false, true, true)
		nf := newFunc("pref", []Val{src})
		nf.path = cp(base)
		nf.sp = f.sp
		return nf
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
	case KindInteger, KindFloat:
		var fv float64
		if sv.kind == KindInteger {
			fv = float64(sv.peg.(int64))
		} else {
			fv = sv.peg.(float64)
		}
		res := math.Floor(fv)
		if up {
			res = math.Ceil(fv)
		}
		// The ceiling/floor keeps the ARGUMENT's kind (upper(2) is an
		// integer 2, upper(1.1) is a float 2.0): the function must not
		// narrow float to integer. This also makes the actual result
		// kind agree with the superior() this func advertises. A kind
		// this switch does not handle falls through to invalid-arg
		// rather than silently producing a wrong-kind value.
		if sv.kind == KindInteger && isIntegerKind(res, "") {
			return newInteger(int64(res))
		}
		return newFloat(res)
	}
	return makeNilErr(ctx, "invalid-arg", args[0], nil)
}

// setClosed implements close()/open(): mark a map or list as (not) closed.
func setClosed(ctx *Ctx, f *FuncVal, args []Val, closed bool) Val {
	if len(args) == 0 {
		return makeNilErr(ctx, "no_first_arg", f, nil)
	}
	switch v := args[0].(type) {
	case *MapVal:
		v.closed = closed
	case *ListVal:
		v.closed = closed
	}
	return args[0]
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
// Junction members are wrapped too: `pref(*1e3|hello)` becomes
// `**1e3|*hello`, whose rank rules pick *hello (mirrors the TS walk,
// which visits disjunct/conjunct members). Kinds stay unwrapped, so
// `pref(boolean|11)` leaves the kind as a plain member.
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
	case *DisjunctVal:
		for i := range n.peg {
			n.peg[i] = walkPref(n.peg[i])
		}
		return n
	case *ConjunctVal:
		for i := range n.peg {
			n.peg[i] = walkPref(n.peg[i])
		}
		return n
	}
	return v
}
