//go:build darwin || dragonfly || freebsd || netbsd || openbsd

/* Copyright (c) 2026 Richard Rodger, MIT License */

package main

import "syscall"

const ioctlReadTermios = syscall.TIOCGETA
