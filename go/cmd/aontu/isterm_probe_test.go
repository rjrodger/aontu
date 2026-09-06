/* Copyright (c) 2026 Richard Rodger, MIT License */

package main

import (
	"os"
	"testing"
)

// terminalForTest opens something isTerminal actually answers yes to,
// or reports that this platform has none to offer.
//
// A pty MASTER is a terminal on Linux, which is where the coverage
// gate runs, so the colour rules can be pinned against a real one
// there. It is NOT one on macOS: /dev/ptmx opens, and the descriptor
// only becomes a terminal once the slave side is granted, unlocked
// and opened. So the test asks isTerminal rather than assuming the
// open was enough -- assuming it reddened every macOS job.
func terminalForTest(t *testing.T) *os.File {
	t.Helper()
	f, err := os.OpenFile("/dev/ptmx", os.O_RDWR, 0)
	if nil != err {
		return nil
	}
	if !isTerminal(f) {
		f.Close()
		return nil
	}
	t.Cleanup(func() { f.Close() })
	return f
}
