//go:build windows

/* Copyright (c) 2026 Richard Rodger, MIT License */

package main

import (
	"os"
	"syscall"
)

// GetConsoleMode succeeds only for a console handle, which is the
// Windows spelling of the terminal question isterm_unix.go asks with
// the terminal-attributes ioctl.
func isTerminal(f *os.File) bool {
	var mode uint32
	return nil == syscall.GetConsoleMode(syscall.Handle(f.Fd()), &mode)
}
