//go:build !linux && !darwin && !dragonfly && !freebsd && !netbsd && !openbsd && !windows

/* Copyright (c) 2026 Richard Rodger, MIT License */

package main

import "os"

func isTerminal(_ *os.File) bool { return false }
