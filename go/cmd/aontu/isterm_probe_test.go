/* Copyright (c) 2026 Richard Rodger, MIT License */

package main

import (
	"os"
	"testing"
)

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
