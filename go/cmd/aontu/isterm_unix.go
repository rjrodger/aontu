//go:build linux || darwin || dragonfly || freebsd || netbsd || openbsd

/* Copyright (c) 2026 Richard Rodger, MIT License */

package main

import (
	"os"
	"syscall"
	"unsafe"
)

// isTerminal reports whether the file is a TERMINAL, which is the
// question `process.stdout.isTTY` answers in Node and the one every
// colour and REPL gate in this command means to ask.
//
// Only the terminal-attributes ioctl answers it. The obvious test --
// `info.Mode()&os.ModeCharDevice` -- asks whether the inode is a
// CHARACTER DEVICE, and /dev/null, /dev/zero and /dev/random all are.
// That made `aontu view ... --out golden.txt --check model.aon
// >/dev/null` compare a plain golden against ANSI-coloured bytes and
// exit 1, in the Go port only, over a figure the two ports write
// byte-identically -- and `>/dev/null` is what a CI script writes.
func isTerminal(f *os.File) bool {
	var t syscall.Termios
	_, _, errno := syscall.Syscall6(syscall.SYS_IOCTL, f.Fd(),
		ioctlReadTermios, uintptr(unsafe.Pointer(&t)), 0, 0, 0)
	return 0 == errno
}
