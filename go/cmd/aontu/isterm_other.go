//go:build !linux && !darwin && !dragonfly && !freebsd && !netbsd && !openbsd && !windows

/* Copyright (c) 2026 Richard Rodger, MIT License */

package main

import "os"

// Everywhere else -- solaris, illumos, aix, plan9, js/wasm -- the
// module must still BUILD, and it does so with the safe answer: no
// terminal, so colour is forced off and stdin reads rather than
// opening a REPL. `make publish` pushes a tag that proxy.golang.org
// serves to every platform, so a build tag that misses one turns up as
// a red matrix on pkg.go.dev in a release commit.
func isTerminal(_ *os.File) bool { return false }
