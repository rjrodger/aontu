/* Copyright (c) 2025 Richard Rodger, MIT License */

package aontu

import "strings"

// Ctx carries unification state: the root Val (for path resolution,
// once references are ported) and the collected error list.
type Ctx struct {
	root  Val
	err   []*NilVal
	depth int // unite recursion depth (cycle guard)
	cc    int // current fixpoint pass (for late-resolving funcs)
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
