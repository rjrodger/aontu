/* Copyright (c) 2026 Richard Rodger, MIT License */

package aontu

import "strings"

// translateExpandSet reads a character set, expanding `a-z` ranges, or
// false where a range runs backwards. Mirrors expandSet in
// ts/src/val/TranslateFuncVal.ts.
func translateExpandSet(set string) ([]rune, bool) {
	cps := []rune(set)
	out := []rune{}

	for i := 0; i < len(cps); i++ {
		if i+2 < len(cps) && '-' == cps[i+1] {
			lo, hi := cps[i], cps[i+2]
			if hi < lo {
				return nil, false
			}
			for cp := lo; cp <= hi; cp++ {
				out = append(out, cp)
			}
			i += 2
			continue
		}
		out = append(out, cps[i])
	}

	return out, true
}

func translateFunc(ctx *Ctx, f *FuncVal, args []Val) Val {
	if len(args) < 2 || 3 < len(args) { //coverage:ignore arity {2,3} is refused at parse
		return makeNilErrFull(ctx, "invalid-arg", f, nil, "arity", nil)
	}

	src, ok := stringPeg(args[0])
	if !ok {
		return makeNilErrFull(ctx, "invalid-arg", f, args[0], "src", nil)
	}

	fromText, ok := stringPeg(args[1])
	if !ok {
		return makeNilErrFull(ctx, "invalid-arg", f, args[1], "from", nil)
	}
	from, ok := translateExpandSet(fromText)
	if !ok {
		return makeNilErrFull(ctx, "invalid-arg", f, args[1], "from", nil)
	}

	to := []rune{}
	if 3 == len(args) {
		toText, ok := stringPeg(args[2])
		if !ok {
			return makeNilErrFull(ctx, "invalid-arg", f, args[2], "to", nil)
		}
		expanded, ok := translateExpandSet(toText)
		if !ok {
			return makeNilErrFull(ctx, "invalid-arg", f, args[2], "to", nil)
		}
		to = expanded
	}

	// The table, built left to right so a character named twice takes
	// its last mapping. An empty `to` maps to nothing, which is the
	// deletion: there is no last character to pad with.
	drop := 0 == len(to)
	var pad rune
	if !drop {
		pad = to[len(to)-1]
	}
	table := map[rune]rune{}
	deleted := map[rune]bool{}
	for i, c := range from {
		if drop {
			deleted[c] = true
			delete(table, c)
			continue
		}
		if i < len(to) {
			table[c] = to[i]
		} else {
			table[c] = pad
		}
		delete(deleted, c)
	}

	var b strings.Builder
	for _, c := range src {
		if deleted[c] {
			continue
		}
		if sub, ok := table[c]; ok {
			b.WriteRune(sub)
			continue
		}
		b.WriteRune(c)
	}

	return newString(b.String())
}
