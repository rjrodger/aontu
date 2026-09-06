//go:build linux

/* Copyright (c) 2026 Richard Rodger, MIT License */

package main

import "syscall"

// TCGETS is the terminal-attributes read on Linux; the BSDs spell it
// TIOCGETA. The constant is the only part of isTerminal that differs.
const ioctlReadTermios = syscall.TCGETS
