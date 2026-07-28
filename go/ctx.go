/* Copyright (c) 2025 Richard Rodger, MIT License */

package aontu

import "strings"

// Ctx carries unification state: the root Val (for path resolution,
// once references are ported) and the collected error list.
type Ctx struct {
	root   Val
	err    []*NilVal
	depth  int             // unite recursion depth (cycle guard)
	cc     int             // current fixpoint pass (for late-resolving funcs)
	hidden map[string]bool // source paths hidden by move()
	vars   map[string]Val  // user-provided variables, resolved by $name
	// collect: generation inside an optional subtree — failures are
	// isolated (skipped/partial output) instead of raised, mirroring
	// the cctx clone({err: [], collect: true}) in TS BagVal.gen.
	collect bool
	// typeSnap caches the structural inner template of a type() reached
	// via a ref spread (unwrapTypeSpread), captured while its key()/path()
	// are still unresolved so later passes don't re-read the source-
	// resolved form. Keyed by the (per-parse) RefVal; lives for the run.
	typeSnap map[*RefVal]Val
}

func (c *Ctx) hide(path []string) {
	if c.hidden == nil {
		c.hidden = map[string]bool{}
	}
	c.hidden[pathKey(path)] = true
}

func (c *Ctx) isHidden(path []string) bool {
	return c.hidden != nil && c.hidden[pathKey(path)]
}

// isHiddenPrefix reports whether path or any ancestor of it has been
// hidden by move(). Used by the FuncVal freeze shortcut: a func inside
// a moved-away (hidden) subtree freezes as pending instead of
// resolving (in TS the hide mark reaches the func object itself and
// FuncBaseVal.unify freezes marked funcs against TOP; the Go port
// tracks hiding by path, so the ancestor check is the equivalent).
func (c *Ctx) isHiddenPrefix(path []string) bool {
	if c.hidden == nil {
		return false
	}
	for i := 1; i <= len(path); i++ {
		if c.hidden[pathKey(path[:i])] {
			return true
		}
	}
	return false
}

func pathKey(path []string) string {
	return strings.Join(path, "\x00")
}

func (c *Ctx) adderr(n *NilVal) {
	for _, e := range c.err {
		if e == n {
			return
		}
	}
	c.err = append(c.err, n)
}

func (c *Ctx) errmsg() string {
	parts := make([]string, 0, len(c.err))
	for _, e := range c.err {
		parts = append(parts, e.Message())
	}
	return strings.Join(parts, "\n------\n")
}
