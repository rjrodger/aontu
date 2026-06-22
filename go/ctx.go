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
