//go:build linux || darwin || dragonfly || freebsd || netbsd || openbsd

/* Copyright (c) 2026 Richard Rodger, MIT License */

package main

import (
	"os"
	"syscall"
	"unsafe"
)

func isTerminal(f *os.File) bool {
	var t syscall.Termios
	_, _, errno := syscall.Syscall6(syscall.SYS_IOCTL, f.Fd(),
		ioctlReadTermios, uintptr(unsafe.Pointer(&t)), 0, 0, 0)
	return 0 == errno
}
